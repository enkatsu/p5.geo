import { project, projectPath, unproject, fitView, lonToWorldX, latToWorldY, worldSize } from './projection.js';
import { asPolygon, polygonContainsWorld } from './contains.js';
import { geoBounds } from './data.js';
import { loadMapLibre } from './maplibre-loader.js';
import { resolveStyle } from './styles.js';

const CSS = `
.p5geo-wrapper { position: relative; isolation: isolate; }
.p5geo-wrapper > .p5geo-map { position: absolute; inset: 0; }
.p5geo-wrapper > canvas { position: absolute; left: 0; top: 0; z-index: 1; pointer-events: none; }
`;

function injectCss() {
  if (document.getElementById('p5geo-css')) return;
  const style = document.createElement('style');
  style.id = 'p5geo-css';
  style.textContent = CSS;
  document.head.appendChild(style);
}

// Warn at most once per function and argument (not per value, so `warned` stays small),
// so a mistake inside draw() doesn't flood the console.
const warned = new Set();
function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function describe(value) {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

// Numbers pass through. Numeric strings, such as table.getString() results, become numbers.
// Anything else gives NaN and a warning naming the function and argument.
function toNumber(value, fn, name) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  warnOnce(`${fn}:${name}`, `p5.geo: ${fn}() expected a number for ${name}, but got ${describe(value)}.`);
  return NaN;
}

// Accepts [lat, lon] or { lat, lon } (also { lat, lng }), with numbers or numeric strings.
function parseLatLon(value, fn) {
  if (Array.isArray(value)) {
    return { lat: toNumber(value[0], fn, 'lat'), lon: toNumber(value[1], fn, 'lon') };
  }
  if (value !== null && typeof value === 'object') {
    return { lat: toNumber(value.lat, fn, 'lat'), lon: toNumber(value.lon ?? value.lng, fn, 'lon') };
  }
  warnOnce(`${fn}:latlon`, `p5.geo: ${fn}() expected a latitude and longitude, but got ${describe(value)}.`);
  return { lat: NaN, lon: NaN };
}

/**
 * A latitude and longitude, in degrees.
 * @typedef {Object} LatLon
 * @property {number} lat - Latitude, from -90 (south) to 90 (north).
 * @property {number} lon - Longitude, from -180 (west) to 180 (east).
 */

/**
 * The geographic view of a sketch: where the map is centered, how far it is zoomed,
 * and how latitude/longitude map onto the canvas. Create one with {@link createGeoMap}.
 *
 * With a basemap (the default), MapLibre draws the map behind the p5 canvas and handles
 * dragging and scrolling; the canvas stays transparent and click-through.
 * With `basemap: false`, it only converts coordinates, with no map and no changes to the page.
 *
 * Methods accept numeric strings as well as numbers (see
 * [Passing numbers and strings](#passing-numbers-and-strings)).
 * @hideconstructor
 */
class GeoMap {
  constructor(p, options = {}) {
    /** @private */
    this._p = p;
    /** @private */
    this._map = null;
    /** @private */
    this._wrapper = null;
    /** @private */
    this._container = null;
    /** @private */
    this._canvas = null;
    /** @private */
    this._removed = false;
    /** @private */
    this._interactive = Boolean(options.interactive ?? options.mapOptions?.interactive ?? true);

    const center = options.center == null ? { lat: 0, lon: 0 } : parseLatLon(options.center, 'createGeoMap');
    /** @private */
    this._view = {
      lat: center.lat,
      lon: center.lon,
      zoom: options.zoom == null ? 2 : toNumber(options.zoom, 'createGeoMap', 'zoom'),
      width: p.width,
      height: p.height,
    };

    /**
     * Resolves to the `GeoMap` once the basemap has been created, or right away with
     * `basemap: false`. There's no need to wait for it to draw: `toScreen()` works from the start.
     * @type {Promise<GeoMap>}
     */
    this.ready = null;
    if (options.basemap === false) {
      this.ready = Promise.resolve(this);
      return;
    }

    injectCss();
    this._wrapper = document.createElement('div');
    this._wrapper.className = 'p5geo-wrapper';
    this._container = document.createElement('div');
    this._container.className = 'p5geo-map';
    this._wrapper.appendChild(this._container);
    this._container.addEventListener('pointerdown', (e) => this._checkPressNotCancelled(e));
    this._adoptCanvas();

    this.ready = loadMapLibre(options.maplibregl).then((maplibregl) => {
      if (!this._removed) this._createMap(maplibregl, options);
      return this;
    });
    this.ready.catch((err) => console.error(err));
  }

  /**
   * Wraps the p5 canvas so the map can sit underneath it. Also called before each
   * draw, in case createCanvas() replaced the canvas after the map was made.
   * @private
   */
  _adoptCanvas() {
    const canvas = this._p.canvas;
    if (!this._wrapper || !canvas || canvas === this._canvas) return;
    if (canvas.parentNode !== this._wrapper) {
      canvas.parentNode?.insertBefore(this._wrapper, canvas);
      this._wrapper.appendChild(canvas);
    }
    this._canvas = canvas;
    this._syncSize();
  }

  /** @private */
  _syncSize() {
    const { width, height } = this._p;
    if (this._wrapper) {
      this._wrapper.style.width = `${width}px`;
      this._wrapper.style.height = `${height}px`;
    }
    if (width === this._view.width && height === this._view.height) return;
    this._view.width = width;
    this._view.height = height;
    this._map?.resize();
  }

  /** @private */
  _createMap(maplibregl, options) {
    const map = new maplibregl.Map({
      container: this._container,
      style: resolveStyle(options.basemap),
      center: [this._view.lon, this._view.lat],
      zoom: this._view.zoom,
      // Overlay drawing can't follow rotation or tilt yet, so keep the map flat and north-up.
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      ...options.mapOptions,
      // Interaction is switched on and off by _applyInteractive(), so it can change later.
      interactive: true,
    });

    map.on('move', () => this._readView());
    map.on('resize', () => this._readView());
    // A sketch that called noLoop() still redraws whenever the map moves or finishes loading tiles.
    map.on('render', () => {
      if (!this._isLooping()) this._p.redraw();
    });

    this._map = map;
    this._readView();
    this._applyInteractive();
  }

  /**
   * Turns the map's mouse, touch and keyboard handlers on or off to match `_interactive`.
   * Rotation and tilt stay off either way.
   * @private
   */
  _applyInteractive() {
    const map = this._map;
    if (!map) return;
    const on = this._interactive;
    for (const name of ['dragPan', 'scrollZoom', 'boxZoom', 'doubleClickZoom', 'keyboard', 'touchZoomRotate']) {
      if (on) map[name].enable();
      else map[name].disable();
    }
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    // MapLibre shows a grab cursor only on interactive maps.
    map.getCanvasContainer().classList.toggle('maplibregl-interactive', on);
  }

  /** @private */
  _readView() {
    const { lng, lat } = this._map.getCenter();
    this._view.lat = lat;
    this._view.lon = lng;
    this._view.zoom = this._map.getZoom();
  }

  /** @private */
  _isLooping() {
    const p = this._p;
    return typeof p.isLooping === 'function' ? p.isLooping() : p._loop !== false;
  }

  /**
   * Without a basemap, nothing else redraws a sketch that called noLoop().
   * @private
   */
  _changed() {
    if (!this._map && !this._isLooping()) this._p.redraw();
  }

  /**
   * MapLibre drags with mouse events, which browsers don't send once a pointerdown has been
   * cancelled, as p5 does when mousePressed() returns false. Warn instead of failing silently.
   * Checked after the event has reached every listener, including p5's on the window.
   * @private
   */
  _checkPressNotCancelled(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    setTimeout(() => {
      if (!e.defaultPrevented || !this._interactive || !this._map) return;
      warnOnce(
        'pressCancelled',
        'p5.geo: the mouse press on the map was cancelled (usually by "return false" in mousePressed()), ' +
          "so the map can't be dragged with the mouse. To handle the mouse in your sketch instead, use " +
          'createGeoMap({ interactive: false }). Otherwise, remove "return false" from mousePressed().'
      );
    });
  }

  /**
   * Called right before each draw().
   * @private
   */
  _beforeDraw() {
    this._adoptCanvas();
    this._syncSize();
    // MapLibre applies drags in its own animation frame, which can run after p5's frame.
    // Rendering the pending map frame now keeps the map and the sketch on the same frame,
    // so drawn shapes don't lag a frame behind while dragging.
    if (this._map?._frameRequest && this._isLooping()) this._map.redraw();
  }

  /**
   * Called right after each draw(). Moving the map from draw(), with center() for example,
   * would otherwise show the map a frame behind the shapes drawn at the new position.
   * (Looping sketches only: in noLoop() sketches, map renders call redraw().)
   * @private
   */
  _afterDraw() {
    if (this._map?._frameRequest && this._isLooping()) this._map.redraw();
  }

  // ---- Public API ----

  /**
   * @overload
   * @param {number|string} lat
   * @param {number|string} lon
   * @returns {p5.Vector}
   */
  /**
   * @overload
   * @param {LatLon|Array<number|string>} point
   * @returns {p5.Vector}
   */
  /**
   * @overload
   * @param {Array<LatLon|Array<number|string>>} points
   * @returns {Array<p5.Vector>}
   */
  /**
   * Converts a latitude and longitude to a position on the canvas.
   *
   * Also accepts `{ lat, lon }` or `[lat, lon]`, or an array of them, which returns an array
   * of vectors. Use the array form for lines and polygon outlines, such as the `path`,
   * `outer` and `holes` from {@link geoLines} and {@link geoPolygons}.
   *
   * The basemap repeats the world sideways, so a single point goes on the copy of the world
   * nearest the center of the canvas. An array is moved as one piece, so shapes never tear
   * apart across the antimeridian. Works before the basemap has loaded.
   *
   * Positions are measured from the top-left corner, like `mouseX` and `mouseY`. On a `WEBGL`
   * canvas, where (0, 0) is the center, call `translate(-width / 2, -height / 2)` before drawing.
   * @param {number|LatLon|Array<number>|Array<LatLon>} lat - Latitude, or a point, or an array of points.
   * @param {number} [lon] - Longitude, when `lat` is a number.
   * @returns {p5.Vector|Array<p5.Vector>} The position on the canvas, or one per point.
   * @example
   * const p = myMap.toScreen(35.6586, 139.7454);
   * circle(p.x, p.y, 20);
   * @example
   * beginShape();
   * for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
   * endShape(CLOSE);
   */
  toScreen(lat, lon) {
    if (lon === undefined && Array.isArray(lat) && (lat.length === 0 || typeof lat[0] === 'object')) {
      const points = lat.map((ll) => parseLatLon(ll, 'toScreen'));
      return projectPath(points, this._view).map(({ x, y }) => this._p.createVector(x, y));
    }
    const ll =
      lon === undefined
        ? parseLatLon(lat, 'toScreen')
        : { lat: toNumber(lat, 'toScreen', 'lat'), lon: toNumber(lon, 'toScreen', 'lon') };
    const { x, y } = project(ll.lat, ll.lon, this._view);
    return this._p.createVector(x, y);
  }

  /**
   * Converts a position on the canvas to a latitude and longitude.
   * @param {number} x
   * @param {number} y
   * @returns {LatLon}
   * @example
   * const here = myMap.fromScreen(mouseX, mouseY);
   * text(`${here.lat.toFixed(4)}, ${here.lon.toFixed(4)}`, mouseX, mouseY);
   */
  fromScreen(x, y) {
    return unproject(toNumber(x, 'fromScreen', 'x'), toNumber(y, 'fromScreen', 'y'), this._view);
  }

  /**
   * Whether a position on the canvas is inside a polygon, as drawn with `toScreen()`: inside
   * its outline and outside every hole. For the mouse, use {@link GeoMap#isMouseOver}.
   * @param {{outer: Array<LatLon>, holes: Array<Array<LatLon>>}|Array<LatLon>} polygon - An item
   *   from {@link geoPolygons}, or an outline as an array of `{ lat, lon }`.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   * @example
   * const touched = countries.filter((c) => myMap.contains(c, touches[0].x, touches[0].y));
   */
  contains(polygon, x, y) {
    const p = asPolygon(polygon);
    if (!p) {
      warnOnce(
        'contains:polygon',
        `p5.geo: contains() and isMouseOver() expected an item from geoPolygons() or an array of { lat, lon }, but got ${describe(polygon)}.`
      );
      return false;
    }
    x = toNumber(x, 'contains', 'x');
    y = toNumber(y, 'contains', 'y');
    if (Number.isNaN(x) || Number.isNaN(y)) return false;
    // The canvas position in world units, on the same world copies toScreen() draws.
    const { lat, lon, zoom, width, height } = this._view;
    const scale = worldSize(zoom);
    const centerX = lonToWorldX(lon);
    const wx = centerX + (x - width / 2) / scale;
    const wy = latToWorldY(lat) + (y - height / 2) / scale;
    try {
      return polygonContainsWorld(p, wx, wy, centerX);
    } catch (err) {
      // A ring with coordinates that aren't numbers; GeoMap methods don't throw.
      warnOnce('contains:coordinates', `p5.geo: contains() couldn't read the polygon's coordinates (${err.message}).`);
      return false;
    }
  }

  /**
   * Whether the mouse is over a polygon, as drawn with `toScreen()`. Always `false` while the
   * mouse is outside the canvas.
   * @param {{outer: Array<LatLon>, holes: Array<Array<LatLon>>}|Array<LatLon>} polygon - An item
   *   from {@link geoPolygons}, or an outline as an array of `{ lat, lon }`.
   * @returns {boolean}
   * @example
   * for (const country of countries) {
   *   fill(myMap.isMouseOver(country) ? 'tomato' : 'white');
   *   beginShape();
   *   for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
   *   endShape(CLOSE);
   * }
   */
  isMouseOver(polygon) {
    const { mouseX, mouseY, width, height } = this._p;
    const onCanvas = mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
    // NaN makes contains() return false quietly, while still checking the polygon.
    return onCanvas ? this.contains(polygon, mouseX, mouseY) : this.contains(polygon, NaN, NaN);
  }

  /**
   * @overload
   * @returns {LatLon}
   */
  /**
   * @overload
   * @param {number|string} lat
   * @param {number|string} lon
   * @returns {GeoMap}
   */
  /**
   * @overload
   * @param {LatLon|Array<number|string>} point
   * @returns {GeoMap}
   */
  /**
   * Gets or sets the center of the map. With no arguments, returns the center.
   * With `center(lat, lon)`, `center([lat, lon])` or `center({ lat, lon })`, moves the map there.
   * @param {number|LatLon|Array<number>} [lat]
   * @param {number} [lon]
   * @returns {LatLon|GeoMap} The center, or the `GeoMap` when setting.
   */
  center(lat, lon) {
    if (lat === undefined) return { lat: this._view.lat, lon: this._view.lon };
    ({ lat, lon } =
      lon === undefined
        ? parseLatLon(lat, 'center')
        : { lat: toNumber(lat, 'center', 'lat'), lon: toNumber(lon, 'center', 'lon') });
    this._view.lat = lat;
    this._view.lon = lon;
    this._map?.jumpTo({ center: [lon, lat] });
    this._changed();
    return this;
  }

  /**
   * @overload
   * @returns {number}
   */
  /**
   * @overload
   * @param {number|string} level
   * @returns {GeoMap}
   */
  /**
   * Gets or sets the zoom level. Each step doubles the scale; levels match MapLibre
   * (the whole world is 512 pixels wide at zoom 0).
   * @param {number} [level]
   * @returns {number|GeoMap} The zoom level (possibly fractional), or the `GeoMap` when setting.
   */
  zoom(level) {
    if (level === undefined) return this._view.zoom;
    level = toNumber(level, 'zoom', 'level');
    this._view.zoom = level;
    this._map?.jumpTo({ zoom: level });
    this._changed();
    return this;
  }

  /**
   * @overload
   * @returns {boolean}
   */
  /**
   * @overload
   * @param {boolean} enabled
   * @returns {GeoMap}
   */
  /**
   * Gets or sets whether the map can be dragged and zoomed with the mouse, touch and keyboard.
   * A locked map can still be moved by code (`center()`, `zoom()`, `flyTo()`, `fit()`), and
   * dragging on the canvas only reaches the sketch, such as `mouseDragged()`. Use it when the
   * sketch handles the mouse itself; returning `false` from `mousePressed()` also stops mouse
   * dragging, with a warning. Has no effect with `basemap: false`.
   * @param {boolean} [enabled]
   * @returns {boolean|GeoMap} Whether the map is interactive, or the `GeoMap` when setting.
   * @example
   * // A map that stays put, so dragging draws instead.
   * myMap = createGeoMap({ center: [35.68, 139.76], zoom: 12, interactive: false });
   * @example
   * // Press L to lock or unlock the map.
   * function keyPressed() {
   *   if (key === 'l') myMap.interactive(!myMap.interactive());
   * }
   */
  interactive(enabled) {
    if (enabled === undefined) return this._interactive;
    this._interactive = Boolean(enabled);
    this._applyInteractive();
    return this;
  }

  /**
   * Centers and zooms so that all of the data is on the canvas.
   * @param {*} data - Anything {@link geoPoints}, {@link geoLines} or {@link geoPolygons}
   *   accept or return, or an array of `{ lat, lon }`.
   * @param {Object} [options]
   * @param {number} [options.padding=20] - Space to leave around the data, in pixels.
   * @param {number} [options.maxZoom=16] - Upper limit, so a single point isn't zoomed in all the way.
   * @returns {GeoMap}
   * @example
   * countries = geoPolygons(await loadJSON('countries.geojson'));
   * myMap = createGeoMap({ basemap: false });
   * myMap.fit(countries);
   */
  fit(data, options) {
    const bounds = geoBounds(data);
    if (!bounds) return this;
    const fitOptions = {};
    if (options?.padding !== undefined) fitOptions.padding = toNumber(options.padding, 'fit', 'padding');
    if (options?.maxZoom !== undefined) fitOptions.maxZoom = toNumber(options.maxZoom, 'fit', 'maxZoom');
    const { lat, lon, zoom } = fitView(bounds, this._view.width, this._view.height, fitOptions);
    this._view.lat = lat;
    this._view.lon = lon;
    this._view.zoom = zoom;
    this._map?.jumpTo({ center: [lon, lat], zoom });
    this._changed();
    return this;
  }

  /**
   * Animates to a place. Without a basemap, jumps there immediately.
   * @param {number} lat
   * @param {number} lon
   * @param {number} [zoom] - Defaults to the current zoom level.
   * @returns {GeoMap}
   */
  flyTo(lat, lon, zoom = this._view.zoom) {
    lat = toNumber(lat, 'flyTo', 'lat');
    lon = toNumber(lon, 'flyTo', 'lon');
    zoom = toNumber(zoom, 'flyTo', 'zoom');
    if (!this._map) {
      this._view.lat = lat;
      this._view.lon = lon;
      this._view.zoom = zoom;
      this._changed();
      return this;
    }
    this._map.flyTo({ center: [lon, lat], zoom });
    return this;
  }

  /**
   * The underlying [maplibregl.Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/),
   * for anything p5.geo doesn't cover. `null` until {@link GeoMap#ready} resolves, and always
   * `null` with `basemap: false`.
   * @type {?Object}
   */
  get maplibre() {
    return this._map;
  }

  /**
   * Removes the map and puts the canvas back where it was. Also happens when the
   * sketch's `remove()` is called.
   */
  remove() {
    this._removed = true;
    this._map?.remove();
    this._map = null;
    if (!this._wrapper) return;
    // Put the canvas back where it was, but only if it's still ours: when the whole sketch
    // is removed, p5 takes the canvas out of the page before this runs, and putting it back
    // would leave an orphan canvas behind.
    if (this._canvas?.parentNode === this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.insertBefore(this._canvas, this._wrapper);
    }
    this._wrapper.remove();
  }
}

export { GeoMap };
