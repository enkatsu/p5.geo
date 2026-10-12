# Loading data

p5.geo leaves loading to p5's own `loadTable()` and `loadJSON()`. Pass what they return to `geoPoints()`, `geoLines()` or `geoPolygons()`, and you get a plain list to loop over. Every coordinate in it is `{ lat, lon }`.

## Points from a CSV

```js
let myMap, places;

async function setup() {
  createCanvas(800, 600);
  const table = await loadTable('places.csv', ',', 'header');
  places = geoPoints(table); // [{ lat, lon, properties }, ...]
  myMap = createGeoMap();
  myMap.fit(places); // center and zoom so every point is on screen
}

function draw() {
  clear();
  for (const place of places) {
    const p = myMap.toScreen(place);
    circle(p.x, p.y, 10);
  }
}
```

- Load the CSV with `'header'`, so its first row names the columns.
- `geoPoints()` finds the latitude and longitude columns by name: `lat`, `latitude` or `緯度`, and `lon`, `lng`, `long`, `longitude` or `経度`. For other names, say which: `geoPoints(table, { lat: 'y', lon: 'x' })`.
- `properties` holds every column of the row. Values that look like numbers are numbers, so `place.properties.population * 2` works.
- Rows without a valid latitude and longitude are skipped, with a message in the console.

Values straight from `table.getString()` work too: `myMap.toScreen(row.getString('lat'), row.getString('lon'))`.

<Example name="csv-earthquakes" />

## Shapes from GeoJSON

```js
const world = await loadJSON('countries.geojson');
const countries = geoPolygons(world); // [{ outer, holes, properties }, ...]
```

| Function | Returns, one item per… |
|---|---|
| `geoPoints(geojson)` | point: `{ lat, lon, properties }` |
| `geoLines(geojson)` | line: `{ path, properties }` |
| `geoPolygons(geojson)` | polygon: `{ outer, holes, properties }` |

A feature made of several parts, such as a country with islands, gives one item per part. The parts share the same `properties` object.

Pass a whole list of points to `toScreen()` to get a list of positions back, ready for `vertex()`. Draw the holes, such as a lake or a country inside another one, with `beginContour()`:

```js
for (const country of countries) {
  beginShape();
  for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
  for (const hole of country.holes) {
    beginContour();
    for (const p of myMap.toScreen(hole)) vertex(p.x, p.y);
    endContour();
  }
  endShape(CLOSE);
}
```

Use the list form rather than converting points one by one: near the antimeridian (180° longitude), it keeps each shape in one piece.

<Example name="geojson-world" />
