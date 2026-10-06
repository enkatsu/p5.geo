// Web Mercator projection core.
// No dependency on MapLibre or p5, so it can be used without a basemap and tested in Node.
//
// "World units" run from 0 to 1 across the whole map (x: west to east, y: north to south).
// Screen coordinates are CSS pixels, which is the coordinate system p5 draws in.
//
// These functions are strict: anything but a number is a TypeError. (NaN is a number and
// passes through.) The forgiving, beginner-facing conversion of numeric strings lives in
// GeoMap; here a string would otherwise slip into `+` and give a plausible wrong number.

function describe(value) {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

function checkNumber(value, fn, name) {
  if (typeof value !== 'number') {
    throw new TypeError(`p5.geo.${fn}(): ${name} must be a number, but got ${describe(value)}.`);
  }
}

function checkView(view, fn) {
  if (view === null || typeof view !== 'object') {
    throw new TypeError(`p5.geo.${fn}(): view must be { lat, lon, zoom, width, height }, but got ${describe(view)}.`);
  }
  for (const key of ['lat', 'lon', 'zoom', 'width', 'height']) checkNumber(view[key], fn, `view.${key}`);
}

/**
 * The width of the world in pixels at zoom 0. MapLibre uses 512, and matching it keeps zoom
 * levels interchangeable.
 * @memberof geo
 * @static
 * @name TILE_SIZE
 * @constant {number}
 */
export const TILE_SIZE = 512;

/**
 * The northern and southern limit of Web Mercator, in degrees. Latitudes beyond it are clamped.
 * @memberof geo
 * @static
 * @name MAX_LATITUDE
 * @constant {number}
 */
export const MAX_LATITUDE = 85.051128779806604;

/**
 * Longitude → world units (0 at 180°W to 1 at 180°E).
 * @memberof geo
 * @static
 * @function lonToWorldX
 * @param {number} lon
 * @returns {number}
 */
export function lonToWorldX(lon) {
  checkNumber(lon, 'lonToWorldX', 'lon');
  return (lon + 180) / 360;
}

/**
 * Latitude → world units (0 at the northern limit to 1 at the southern limit).
 * @memberof geo
 * @static
 * @function latToWorldY
 * @param {number} lat
 * @returns {number}
 */
export function latToWorldY(lat) {
  checkNumber(lat, 'latToWorldY', 'lat');
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const phi = (clamped * Math.PI) / 180;
  return (1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2;
}

/**
 * World units → longitude.
 * @memberof geo
 * @static
 * @function worldXToLon
 * @param {number} x
 * @returns {number}
 */
export function worldXToLon(x) {
  checkNumber(x, 'worldXToLon', 'x');
  return x * 360 - 180;
}

/**
 * World units → latitude.
 * @memberof geo
 * @static
 * @function worldYToLat
 * @param {number} y
 * @returns {number}
 */
export function worldYToLat(y) {
  checkNumber(y, 'worldYToLat', 'y');
  const n = Math.PI * (1 - 2 * y);
  return (Math.atan(Math.sinh(n)) * 180) / Math.PI;
}

/**
 * The width of the world in pixels at a zoom level.
 * @memberof geo
 * @static
 * @function worldSize
 * @param {number} zoom
 * @returns {number}
 */
export function worldSize(zoom) {
  checkNumber(zoom, 'worldSize', 'zoom');
  return TILE_SIZE * Math.pow(2, zoom);
}

/**
 * What a map shows: its center sits in the middle of a `width` × `height` screen.
 * @typedef {Object} View
 * @property {number} lat - Latitude of the center.
 * @property {number} lon - Longitude of the center.
 * @property {number} zoom - Zoom level.
 * @property {number} width - Screen width in pixels.
 * @property {number} height - Screen height in pixels.
 */

/**
 * Latitude/longitude → screen position. Uses the copy of the world nearest the center,
 * so a point stays visible wherever the map is panned to (the basemap repeats the world sideways).
 * @memberof geo
 * @static
 * @function project
 * @param {number} lat
 * @param {number} lon
 * @param {View} view
 * @returns {{x: number, y: number}}
 */
export function project(lat, lon, view) {
  checkNumber(lat, 'project', 'lat');
  checkNumber(lon, 'project', 'lon');
  checkView(view, 'project');
  const scale = worldSize(view.zoom);
  let dx = lonToWorldX(lon) - lonToWorldX(view.lon);
  dx -= Math.round(dx);
  const dy = latToWorldY(lat) - latToWorldY(view.lat);
  return {
    x: view.width / 2 + dx * scale,
    y: view.height / 2 + dy * scale,
  };
}

/**
 * Projects a line or polygon outline as one piece: the whole list moves to the copy of the
 * world nearest the center. Projecting each point separately could tear shapes that straddle
 * the far side of the world.
 * @memberof geo
 * @static
 * @function projectPath
 * @param {Array<LatLon>} points
 * @param {View} view
 * @returns {Array<{x: number, y: number}>}
 */
export function projectPath(points, view) {
  if (!Array.isArray(points)) {
    throw new TypeError(`p5.geo.projectPath(): points must be an array of { lat, lon }, but got ${describe(points)}.`);
  }
  checkView(view, 'projectPath');
  points.forEach((pt, i) => {
    checkNumber(pt?.lat, 'projectPath', `points[${i}].lat`);
    checkNumber(pt?.lon, 'projectPath', `points[${i}].lon`);
  });
  if (points.length === 0) return [];
  const scale = worldSize(view.zoom);
  const cx = lonToWorldX(view.lon);
  const cy = latToWorldY(view.lat);
  let min = Infinity;
  let max = -Infinity;
  const xs = points.map(({ lon }) => {
    const x = lonToWorldX(lon);
    if (x < min) min = x;
    if (x > max) max = x;
    return x;
  });
  const shift = Math.round((min + max) / 2 - cx);
  return points.map(({ lat }, i) => ({
    x: view.width / 2 + (xs[i] - cx - shift) * scale,
    y: view.height / 2 + (latToWorldY(lat) - cy) * scale,
  }));
}

/**
 * Screen position → latitude/longitude. Longitude is normalized to -180…180.
 * @memberof geo
 * @static
 * @function unproject
 * @param {number} x
 * @param {number} y
 * @param {View} view
 * @returns {LatLon}
 */
export function unproject(x, y, view) {
  checkNumber(x, 'unproject', 'x');
  checkNumber(y, 'unproject', 'y');
  checkView(view, 'unproject');
  const scale = worldSize(view.zoom);
  const wx = lonToWorldX(view.lon) + (x - view.width / 2) / scale;
  const wy = latToWorldY(view.lat) + (y - view.height / 2) / scale;
  let lon = worldXToLon(wx);
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat: worldYToLat(wy), lon };
}

/**
 * The center and zoom that fit a bounding box on a screen.
 * @memberof geo
 * @static
 * @function fitView
 * @param {{north: number, south: number, east: number, west: number}} bounds
 * @param {number} width - Screen width in pixels.
 * @param {number} height - Screen height in pixels.
 * @param {Object} [options]
 * @param {number} [options.padding=20] - Space to leave on each side, in pixels.
 * @param {number} [options.maxZoom=16] - Upper limit for the zoom.
 * @returns {{lat: number, lon: number, zoom: number}}
 */
export function fitView(bounds, width, height, { padding = 20, maxZoom = 16 } = {}) {
  if (bounds === null || typeof bounds !== 'object') {
    throw new TypeError(`p5.geo.fitView(): bounds must be { north, south, east, west }, but got ${describe(bounds)}.`);
  }
  for (const key of ['north', 'south', 'east', 'west']) checkNumber(bounds[key], 'fitView', `bounds.${key}`);
  checkNumber(width, 'fitView', 'width');
  checkNumber(height, 'fitView', 'height');
  checkNumber(padding, 'fitView', 'padding');
  checkNumber(maxZoom, 'fitView', 'maxZoom');
  const x0 = lonToWorldX(bounds.west);
  const x1 = lonToWorldX(bounds.east);
  const y0 = latToWorldY(bounds.north);
  const y1 = latToWorldY(bounds.south);
  const availableW = Math.max(1, width - 2 * padding);
  const availableH = Math.max(1, height - 2 * padding);
  const scale = Math.min(availableW / (x1 - x0), availableH / (y1 - y0));
  const zoom = Math.min(maxZoom, Math.log2(scale / TILE_SIZE));
  return {
    lat: worldYToLat((y0 + y1) / 2),
    lon: worldXToLon((x0 + x1) / 2),
    zoom,
  };
}
