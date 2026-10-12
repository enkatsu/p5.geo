import { GeoMap } from './geomap.js';
import * as projection from './projection.js';
import { STYLES } from './styles.js';
import { geoPoints, geoLines, geoPolygons, geoBounds } from './data.js';
import { containsLatLon } from './contains.js';
import { VERSION } from './version.js';

const maps = new Set();

// In p5 1.x global mode, hooks run with `this === window` rather than the sketch instance.
function mapsOf(instance) {
  const isWindow = typeof window !== 'undefined' && instance === window;
  return [...maps].filter((m) => m._p === instance || (isWindow && m._p._isGlobal));
}

/**
 * The projection and data helpers as plain functions, independent of p5 and MapLibre.
 * Available in sketches as `p5.geo`. They are strict: every argument must be a number,
 * or they throw a `TypeError`.
 * @namespace geo
 */

// The p5.js 2.x addon: pass it to p5.registerAddon(). src/browser.js registers it
// automatically for <script> tags; with a bundler, the sketch registers it (see src/index.js).
export default function p5geo(p5, fn, lifecycles) {
  /**
   * Creates a map behind the canvas. Call it after `createCanvas()`.
   *
   * The canvas stays on top, transparent and click-through: the map handles dragging and
   * scrolling, and `mouseX`, `mouseY` and p5's mouse events keep working. Call `clear()`
   * (not `background()`) at the start of `draw()` so the map stays visible.
   *
   * MapLibre GL JS is loaded automatically from jsDelivr, and attribution for the map data
   * is shown automatically. The map can't be rotated or tilted, because shapes drawn on the
   * canvas couldn't follow.
   * @function createGeoMap
   * @param {Object} [options]
   * @param {Array<number>|LatLon} [options.center=[0, 0]] - Where the map is centered, as
   *   `[lat, lon]` or `{ lat, lon }` (`{ lat, lng }` also works).
   * @param {number} [options.zoom=2] - Zoom level. See {@link GeoMap#zoom}.
   * @param {string|Object|false} [options.basemap='positron'] - `'positron'`, `'liberty'` or
   *   `'bright'` (keyless [OpenFreeMap](https://openfreemap.org/) styles), a MapLibre style URL
   *   or style object, or `false` for no map: then nothing is added to the page and the
   *   `GeoMap` only converts coordinates.
   * @param {boolean} [options.interactive=true] - Whether the map can be dragged and zoomed.
   *   With `false`, it stays where the sketch puts it. See {@link GeoMap#interactive}.
   * @param {Object} [options.mapOptions] - Extra options for
   *   [maplibregl.Map](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/).
   * @param {Object} [options.maplibregl] - A MapLibre GL JS namespace to use instead of
   *   loading one. A global `maplibregl` is also used if present.
   * @returns {GeoMap}
   * @example
   * let myMap;
   *
   * function setup() {
   *   createCanvas(800, 600);
   *   myMap = createGeoMap({ center: [35.68, 139.76], zoom: 12 });
   * }
   *
   * function draw() {
   *   clear();
   *   const p = myMap.toScreen(35.6586, 139.7454); // Tokyo Tower
   *   circle(p.x, p.y, 20);
   * }
   */
  fn.createGeoMap = function (options) {
    const map = new GeoMap(this, options);
    maps.add(map);
    return map;
  };

  fn.geoPoints = geoPoints;
  fn.geoLines = geoLines;
  fn.geoPolygons = geoPolygons;

  lifecycles.predraw = function () {
    for (const map of mapsOf(this)) map._beforeDraw();
  };

  lifecycles.remove = function () {
    for (const map of mapsOf(this)) {
      map.remove();
      maps.delete(map);
    }
  };

  p5.GeoMap = GeoMap;
  p5.geo = { ...projection, geoBounds, containsLatLon, STYLES, VERSION };
}
