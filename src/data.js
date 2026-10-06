// Turns loaded data into plain lists of coordinates to draw with p5.
// Loading itself is left to p5 (await loadTable(), await loadJSON()).
// No dependency on p5 or MapLibre.
//
// Every coordinate is { lat, lon }. Each function returns a flat array, one item per
// thing to draw, so a single for loop is enough:
//   geoPoints()   → [{ lat, lon, properties }]
//   geoLines()    → [{ path: [{ lat, lon }, ...], properties }]
//   geoPolygons() → [{ outer: [{ lat, lon }, ...], holes: [[...], ...], properties }]
// Multi-part GeoJSON geometries are split into one item per part, sharing `properties`.

const LAT_NAMES = ['lat', 'latitude', '緯度'];
const LON_NAMES = ['lon', 'lng', 'long', 'longitude', '経度'];

// ---- Input detection ----

function isTable(data) {
  return data != null && Array.isArray(data.columns) && Array.isArray(data.rows);
}

function isGeoJSON(data) {
  return data != null && typeof data.type === 'string' && !Array.isArray(data);
}

// A CSV value as a number when it clearly is one ("12", "-3.5", "1e3"), otherwise as is.
// Values like "007" or "" stay strings so codes and blanks aren't mangled.
function autoType(value) {
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?$/.test(s)) return Number(s);
  return value;
}

const HEADER_HINT = "load CSVs with loadTable(file, ',', 'header')";

function findColumn(columns, wanted, candidates, kind) {
  if (columns.every((c) => c == null)) {
    throw new Error(`p5.geo: this table has no column names. To use the first row as names, ${HEADER_HINT}.`);
  }
  if (wanted != null) {
    if (!columns.includes(wanted)) {
      throw new Error(`p5.geo: no column named "${wanted}". Columns are: ${columns.join(', ')}`);
    }
    return wanted;
  }
  const found = columns.find((c) => candidates.includes(String(c).trim().toLowerCase()));
  if (found === undefined) {
    throw new Error(
      `p5.geo: couldn't find a ${kind} column (looked for ${candidates.join(', ')}). ` +
        `Columns are: ${columns.join(', ')}. ` +
        `Name it with an option, e.g. geoPoints(data, { ${kind === 'latitude' ? 'lat' : 'lon'}: 'my_column' }), ` +
        `and ${HEADER_HINT}.`
    );
  }
  return found;
}

// Rows of a p5.Table, or an array of plain objects, as plain objects.
function recordsOf(data) {
  if (isTable(data)) {
    return {
      columns: data.columns,
      records: data.rows.map((row) => {
        const obj = {};
        data.columns.forEach((c, i) => (obj[c] = autoType(row.arr ? row.arr[i] : row.getString(c))));
        return obj;
      }),
    };
  }
  const records = data.map((r) => {
    const obj = {};
    for (const key of Object.keys(r)) obj[key] = autoType(r[key]);
    return obj;
  });
  return { columns: Object.keys(data[0] ?? {}), records };
}

// ---- GeoJSON traversal ----

const toLatLon = ([lon, lat]) => ({ lat, lon });
const ringOf = (coords) => coords.map(toLatLon);

// Calls visit(geometry, properties) for every non-collection geometry.
function eachGeometry(geojson, visit, properties = {}) {
  if (!geojson) return;
  switch (geojson.type) {
    case 'FeatureCollection':
      for (const f of geojson.features) eachGeometry(f, visit);
      break;
    case 'Feature':
      eachGeometry(geojson.geometry, visit, geojson.properties ?? {});
      break;
    case 'GeometryCollection':
      for (const g of geojson.geometries) eachGeometry(g, visit, properties);
      break;
    default:
      visit(geojson, properties);
  }
}

function checkInput(data, fn) {
  if (data == null) {
    throw new Error(`p5.geo: ${fn}() got ${data}. Was the file loaded yet?`);
  }
}

// ---- Public functions ----

/**
 * Extracts points from a table, an array of objects, or GeoJSON.
 *
 * - **p5.Table** from `loadTable(file, ',', 'header')`: the latitude and longitude columns are
 *   found by name (`lat`, `latitude`, `緯度` / `lon`, `lng`, `long`, `longitude`, `経度`, not
 *   case-sensitive). `properties` holds every column of the row; values that look like numbers
 *   become numbers, others (such as `"007"`) stay strings. Rows without a valid latitude and
 *   longitude are skipped, with a warning.
 * - **Array of objects**: read the same way as table rows.
 * - **GeoJSON** (FeatureCollection, Feature or geometry): Point and MultiPoint geometries.
 *   A MultiPoint gives one item per point, sharing `properties`.
 * @param {p5.Table|Array<Object>|Object} data
 * @param {Object} [options]
 * @param {string} [options.lat] - Name of the latitude column, if it isn't found automatically.
 * @param {string} [options.lon] - Name of the longitude column, if it isn't found automatically.
 * @returns {Array<{lat: number, lon: number, properties: Object}>}
 * @throws {Error} If no latitude or longitude column is found, or `data` is `undefined`
 *   (for example, when the file hasn't loaded yet).
 * @example
 * const table = await loadTable('places.csv', ',', 'header');
 * places = geoPoints(table);
 * // in draw():
 * for (const place of places) {
 *   const p = myMap.toScreen(place);
 *   circle(p.x, p.y, 10);
 * }
 */
export function geoPoints(data, options = {}) {
  checkInput(data, 'geoPoints');
  if (isGeoJSON(data)) {
    const points = [];
    eachGeometry(data, (g, properties) => {
      if (g.type === 'Point') points.push({ ...toLatLon(g.coordinates), properties });
      if (g.type === 'MultiPoint') for (const c of g.coordinates) points.push({ ...toLatLon(c), properties });
    });
    return points;
  }

  const { columns, records } = recordsOf(data);
  if (records.length === 0) return [];
  const latKey = findColumn(columns, options.lat, LAT_NAMES, 'latitude');
  const lonKey = findColumn(columns, options.lon, LON_NAMES, 'longitude');

  const points = [];
  let skipped = 0;
  for (const properties of records) {
    const lat = Number(properties[latKey]);
    const lon = Number(properties[lonKey]);
    if (properties[latKey] === '' || properties[lonKey] === '' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      skipped++;
      continue;
    }
    points.push({ lat, lon, properties });
  }
  if (skipped > 0) {
    console.warn(`p5.geo: geoPoints() skipped ${skipped} row(s) without a valid ${latKey}/${lonKey}.`);
  }
  return points;
}

/**
 * Extracts lines from GeoJSON: LineString and MultiLineString geometries.
 * A MultiLineString gives one item per line, sharing `properties`.
 * @param {Object} data - GeoJSON: a FeatureCollection, a Feature or a geometry.
 * @returns {Array<{path: Array<LatLon>, properties: Object}>}
 * @example
 * for (const line of lines) {
 *   noFill();
 *   beginShape();
 *   for (const p of myMap.toScreen(line.path)) vertex(p.x, p.y);
 *   endShape();
 * }
 */
export function geoLines(data) {
  checkInput(data, 'geoLines');
  const lines = [];
  eachGeometry(data, (g, properties) => {
    if (g.type === 'LineString') lines.push({ path: ringOf(g.coordinates), properties });
    if (g.type === 'MultiLineString') for (const c of g.coordinates) lines.push({ path: ringOf(c), properties });
  });
  return lines;
}

/**
 * Extracts polygons from GeoJSON: Polygon and MultiPolygon geometries.
 * A MultiPolygon gives one item per polygon, sharing `properties`.
 * `outer` is the outline; `holes` are cut-outs, to draw with `beginContour()` and `endContour()`.
 * @param {Object} data - GeoJSON: a FeatureCollection, a Feature or a geometry.
 * @returns {Array<{outer: Array<LatLon>, holes: Array<Array<LatLon>>, properties: Object}>}
 * @example
 * beginShape();
 * for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
 * for (const hole of country.holes) {
 *   beginContour();
 *   for (const p of myMap.toScreen(hole)) vertex(p.x, p.y);
 *   endContour();
 * }
 * endShape(CLOSE);
 */
export function geoPolygons(data) {
  checkInput(data, 'geoPolygons');
  const polygons = [];
  const add = (rings, properties) => {
    const [outer, ...holes] = rings.map(ringOf);
    polygons.push({ outer, holes, properties });
  };
  eachGeometry(data, (g, properties) => {
    if (g.type === 'Polygon') add(g.coordinates, properties);
    if (g.type === 'MultiPolygon') for (const p of g.coordinates) add(p, properties);
  });
  return polygons;
}

// Every { lat, lon } in the data, in any of the forms above (raw data, or the arrays
// returned by geoPoints/geoLines/geoPolygons, or a single coordinate list).
export function eachLatLon(data, visit) {
  if (data == null) return;
  if (isGeoJSON(data)) {
    eachGeometry(data, (g) => {
      const walk = (c) => (typeof c[0] === 'number' ? visit(toLatLon(c)) : c.forEach(walk));
      walk(g.coordinates);
    });
    return;
  }
  if (isTable(data)) {
    for (const p of geoPoints(data)) visit(p);
    return;
  }
  if (Array.isArray(data)) {
    for (const item of data) eachLatLon(item, visit);
    return;
  }
  if (typeof data.lat === 'number' && typeof (data.lon ?? data.lng) === 'number') {
    visit({ lat: data.lat, lon: data.lon ?? data.lng });
    return;
  }
  if (data.path) eachLatLon(data.path, visit);
  if (data.outer) eachLatLon(data.outer, visit);
}

/**
 * The bounding box of the data.
 * @memberof geo
 * @static
 * @function geoBounds
 * @param {*} data - Anything {@link geoPoints}, {@link geoLines} or {@link geoPolygons} accept
 *   or return, or an array of `{ lat, lon }`.
 * @returns {?{north: number, south: number, east: number, west: number}} `null` if the data is empty.
 */
export function geoBounds(data) {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;
  eachLatLon(data, ({ lat, lon }) => {
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lon > east) east = lon;
    if (lon < west) west = lon;
  });
  return north === -Infinity ? null : { north, south, east, west };
}
