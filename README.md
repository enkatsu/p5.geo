# p5.geo

**Geospatial visualization for p5.js.**

p5.geo lets you work with maps and geographic data using the drawing functions you already know from p5.js. Load a CSV of coordinates or a GeoJSON file, convert latitude/longitude to screen positions, and draw with `circle()`, `line()`, or `beginShape()`, with or without an interactive basemap.

> **Status:** Early development. The API may change.

## Why p5.geo?

Maps are one of the most compelling things to make with code, but getting started usually means learning a web-mapping framework, its style system, and an API-key signup flow before drawing a single dot. p5.geo aims to remove those barriers:

- **Sketch-first.** The basemap is just a background; everything you draw is plain p5.js.
- **No API keys by default.** Works out of the box with keyless map styles.
- **No build step.** One `<script>` tag, and it runs in the p5.js Web Editor.
- **Maps optional.** Use the projection utilities alone to draw choropleths, point clouds, or abstract geographic visuals without any tiles.

## Getting started

Add p5.geo after p5.js in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2/lib/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.geo@0.1/dist/p5.geo.min.js"></script>
```

In the [p5.js Web Editor](https://editor.p5js.org/), open `index.html` from the sketch's file list and paste the second line below the line that loads p5.js. Nothing else is needed: no API key, no install.

Then draw on a map in `sketch.js`:

```javascript
let myMap;

function setup() {
  createCanvas(800, 600);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 12 });
}

function draw() {
  clear();
  const p = myMap.toScreen(35.6586, 139.7454); // Tokyo Tower
  circle(p.x, p.y, 20);
}
```

Drag and scroll the map: the circle stays on Tokyo Tower. See [examples/](examples/) for more.

## API (draft)

p5.geo targets **p5.js 2.x**. (It also loads in p5.js 1.x, but examples and docs use 2.x.)

Coordinates are always given as **latitude, longitude**, in that order.

Name your map variable something other than `map` (we use `myMap`): a variable called `map` hides p5's own [`map()`](https://p5js.org/reference/p5/map/) function.

| | |
|---|---|
| `createGeoMap(options)` | Creates a map behind the canvas. |
| `myMap.toScreen(lat, lon)` | Latitude/longitude → canvas position. |
| `myMap.fromScreen(x, y)` | Canvas position → latitude/longitude. |
| `myMap.center()` / `myMap.zoom()` | Gets or sets the map center and zoom level. |
| `myMap.flyTo(lat, lon, zoom)` | Animates to a place. |
| `myMap.fit(data)` | Centers and zooms so all of the data is on screen. |
| `myMap.interactive(false)` | Locks the map so it can't be dragged or zoomed (also an option of `createGeoMap()`). |
| `myMap.isMouseOver(polygon)` | Whether the mouse is over a polygon from `geoPolygons()`. |
| `geoPoints()` / `geoLines()` / `geoPolygons()` | Extracts points, lines and polygons from CSV tables and GeoJSON. |

See the [API reference](docs/api.md) for every option and detail. TypeScript types are included: `p5.geo` for instance mode, `p5.geo/global` for global mode.

Load files with p5's own `loadTable()` and `loadJSON()`, then pass the result to `geoPoints()`, `geoLines()` or `geoPolygons()`:

```javascript
let myMap, places;

async function setup() {
  createCanvas(800, 600);
  const table = await loadTable('places.csv', ',', 'header');
  places = geoPoints(table);
  myMap = createGeoMap();
  myMap.fit(places);
}

function draw() {
  clear();
  for (const place of places) {
    const p = myMap.toScreen(place);
    circle(p.x, p.y, 10);
  }
}
```

Call `clear()` (not `background()`) at the start of `draw()` so the map stays visible.

The API is still a draft and may change.

## Using with a bundler

p5.geo is mainly meant for a `<script>` tag, where it registers itself. With a bundler such as Vite, install it from npm and register it yourself, as with any p5.js 2.x addon:

```javascript
import p5 from 'p5';
import geo from 'p5.geo';

p5.registerAddon(geo);
```

MapLibre GL JS still loads from a CDN by default. To bundle it instead, pass it in (and import its CSS):

```javascript
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite: MapLibre's worker has to be bundled separately.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);

const myMap = p.createGeoMap({ maplibregl });
```

The helper functions can be imported by name, for example `import { project } from 'p5.geo'`.

## Architecture

p5.geo is organized in three layers. Each upper layer is optional.

1. **Projection core.** Converts between latitude/longitude and screen coordinates. Has no dependency on any mapping library and works without a basemap.
2. **Data loading.** Helpers for GeoJSON and coordinate CSVs (including tables loaded with `loadTable()`). Returns plain coordinate arrays you can draw however you like.
3. **Basemap.** Interactive tiled maps (pan, zoom) rendered by [MapLibre GL JS](https://maplibre.org/). The p5 canvas is layered transparently on top and stays in sync with the map.

## Roadmap

- [ ] **First milestone:** In the p5.js Web Editor, draw points from a CSV with `circle()` on a keyless basemap, and have them follow the map while dragging.
- [x] Projection-only mode (no basemap)
- [x] GeoJSON / CSV helpers
- [x] Locking the map (`interactive: false`) so the sketch can use the mouse
- [x] Hit-testing for polygons (`isMouseOver()`, `contains()`)
- [ ] Hit-testing for points and lines
- [ ] `saveCanvas()` that composites the map and the sketch
- [x] Global mode and instance mode support
- [x] npm package for bundlers, with TypeScript types
- [ ] Example gallery (earthquakes, GPS tracks, choropleths, animated movement)
- [ ] Optional 3D mode (pitch / bearing) via MapLibre custom layers
- [ ] Submission to the [p5.js Libraries](https://p5js.org/libraries/) page

## Development

Requires Node.js 24 (see `.nvmrc`).

```sh
npm install
npm run dev      # rebuilds on change, serves http://localhost:8000/examples/
npm run dev:lan  # the same, reachable from other devices on the network (to try a phone)
npm test         # unit tests, plus checks that docs/api.md and the TypeScript types are up to date
npm run build    # writes dist/: the <script> build, the bundler build (ESM) and the types
npm run docs     # regenerates docs/api.md from the JSDoc comments in src/
```

Some behavior needs a real browser (the basemap, resizing, removing a sketch). With `npm run dev` running, open http://localhost:8000/test/browser/ and check that every item passes.

## Related projects

- **[Unfolding Maps](http://unfoldingmaps.org/)**: The Processing library that inspired this project. p5.geo carries over its spirit (geographic data in a sketch-friendly API) but is not an official port and does not aim for API compatibility.
- **[p5.geolocation](https://github.com/bmoren/p5.geolocation)**: Acquires and watches the user's location. Complementary: get a position with p5.geolocation, draw it with p5.geo.
- **[Mappa](https://github.com/cvalenzuela/Mappa)**: An earlier p5.js mapping library that overlays a p5 canvas on Leaflet/Mapbox/Google Maps. No longer maintained.

## Map data and attribution

The default basemaps (`'positron'`, `'liberty'` and `'bright'`) come from [OpenFreeMap](https://openfreemap.org/), a free, keyless map service run by Zsolt Ero, with map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and tiles from [OpenMapTiles](https://www.openmaptiles.org/). p5.geo wouldn't be keyless without it.

OpenFreeMap's servers are paid for by donations. If p5.geo is useful to you, or you use it in a class or a workshop, please consider [sponsoring OpenFreeMap](https://github.com/sponsors/hyperknot).

p5.geo shows the required attribution automatically in the corner of the map, above your sketch. Please don't hide it. If you use another map provider, follow its terms.

### If the map stops loading

OpenFreeMap is a free service and comes with no guarantee that it will always be available. If the basemap stops appearing, your sketch keeps working, and you can switch to another map with the `basemap` option:

```javascript
// Any MapLibre style URL, such as MapLibre's own demo map (countries only, no streets).
createGeoMap({ basemap: 'https://demotiles.maplibre.org/style.json' });

// Or no basemap at all: everything you draw still lands in the right place.
createGeoMap({ basemap: false });
```

Other providers' styles work the same way, though most of them need an API key. You can also host OpenFreeMap yourself: see [its repository](https://github.com/hyperknot/openfreemap).

## Contributing

Ideas, issues, and pull requests are welcome. The project is at an early stage, so feedback on API design is especially valuable.

## License

[MIT](LICENSE)
