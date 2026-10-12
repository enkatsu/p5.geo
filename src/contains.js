// Point-in-polygon tests for the polygons from geoPolygons().
// Tests run in Web Mercator world units, where polygon edges are straight lines exactly as
// they are drawn on the canvas (in latitude/longitude they would be slightly curved).
// No dependency on p5 or MapLibre.
import { lonToWorldX, latToWorldY } from './projection.js';

// World-unit rings and their bounding boxes, computed once per ring array.
const cache = new WeakMap();

function worldRing(ring) {
  let entry = cache.get(ring);
  if (entry) return entry;
  const xs = new Float64Array(ring.length);
  const ys = new Float64Array(ring.length);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  ring.forEach(({ lat, lon }, i) => {
    const x = lonToWorldX(lon);
    const y = latToWorldY(lat);
    xs[i] = x;
    ys[i] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  entry = { xs, ys, minX, maxX, minY, maxY };
  cache.set(ring, entry);
  return entry;
}

// Even-odd ray casting. `shift` moves the ring by whole worlds (see projectPath()).
function inRing(ring, x, y, shift = 0) {
  if (ring.length < 3) return false;
  const { xs, ys, minX, maxX, minY, maxY } = worldRing(ring);
  if (x < minX - shift || x > maxX - shift || y < minY || y > maxY) return false;
  let inside = false;
  for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) {
    const xi = xs[i] - shift;
    const xj = xs[j] - shift;
    if (ys[i] > y !== ys[j] > y && x < ((xj - xi) * (y - ys[i])) / (ys[j] - ys[i]) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// The whole-world shift projectPath() applies to a ring when the map is centered at
// world x `centerX`, so tests line up with what toScreen(ring) draws.
function shiftFor(ring, centerX) {
  if (ring.length === 0) return 0;
  const { minX, maxX } = worldRing(ring);
  return Math.round((minX + maxX) / 2 - centerX);
}

// { outer, holes } from geoPolygons(), or a plain array of { lat, lon } (a polygon without holes).
export function asPolygon(value) {
  if (Array.isArray(value)) return { outer: value, holes: [] };
  if (value !== null && typeof value === 'object' && Array.isArray(value.outer)) {
    return { outer: value.outer, holes: Array.isArray(value.holes) ? value.holes : [] };
  }
  return null;
}

// Whether world point (x, y) is inside the polygon as drawn on a map centered at world x
// `centerX`: inside the outline and outside every hole. Used by GeoMap#contains.
export function polygonContainsWorld(polygon, x, y, centerX) {
  if (!inRing(polygon.outer, x, y, shiftFor(polygon.outer, centerX))) return false;
  return !polygon.holes.some((hole) => inRing(hole, x, y, shiftFor(hole, centerX)));
}

function describe(value) {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

/**
 * Whether a latitude and longitude is inside a polygon: inside its outline and outside every
 * hole. Useful for questions about the data itself, such as which country an earthquake was in.
 * Edges are treated as straight lines on the map, as they are drawn.
 *
 * Polygons crossing the antimeridian need to be split there, as GeoJSON recommends.
 * @memberof geo
 * @static
 * @function containsLatLon
 * @param {{outer: Array<LatLon>, holes: Array<Array<LatLon>>}|Array<LatLon>} polygon - An item
 *   from {@link geoPolygons}, or an outline as an array of `{ lat, lon }`.
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 * @example
 * const inJapan = p5.geo.containsLatLon(japan, quake.lat, quake.lon);
 */
export function containsLatLon(polygon, lat, lon) {
  const p = asPolygon(polygon);
  if (!p) {
    throw new TypeError(
      `p5.geo.containsLatLon(): polygon must be an item from geoPolygons() or an array of { lat, lon }, but got ${describe(polygon)}.`
    );
  }
  for (const [name, value] of [['lat', lat], ['lon', lon]]) {
    if (typeof value !== 'number') {
      throw new TypeError(`p5.geo.containsLatLon(): ${name} must be a number, but got ${describe(value)}.`);
    }
  }
  const x = lonToWorldX(lon);
  const y = latToWorldY(lat);
  if (!inRing(p.outer, x, y)) return false;
  return !p.holes.some((hole) => inRing(hole, x, y));
}
