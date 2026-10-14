# p5.geo

**Geospatial visualization for p5.js.**

p5.geo lets you work with maps and geographic data using the drawing functions you already know from p5.js. Load a CSV of coordinates or a GeoJSON file, convert latitude/longitude to screen positions, and draw with `circle()`, `line()`, or `beginShape()`, with or without an interactive basemap.

- **Sketch-first.** The basemap is just a background; everything you draw is plain p5.js.
- **No API keys.** Works out of the box with keyless map styles.
- **No build step.** One `<script>` tag, and it runs in the p5.js Web Editor.
- **Maps optional.** Turn the basemap off and draw maps entirely with p5 shapes.

> **Status:** Early development. The API may change.

**Documentation, guides and live examples: https://enkatsu.github.io/p5.geo/**

## Getting started

Add p5.geo after p5.js in your HTML (in the [p5.js Web Editor](https://editor.p5js.org/), in `index.html`):

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2/lib/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.geo@0.1/dist/p5.geo.min.js"></script>
```

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

Drag and scroll the map: the circle stays on Tokyo Tower. Next, see the [guide](https://enkatsu.github.io/p5.geo/guide/getting-started), the [examples](https://enkatsu.github.io/p5.geo/examples/) and the [API reference](docs/api.md). For bundlers and TypeScript, see [Using with a bundler](https://enkatsu.github.io/p5.geo/guide/bundlers).

## Roadmap

- [x] **First milestone:** In the p5.js Web Editor, draw points from a CSV with `circle()` on a keyless basemap, and have them follow the map while dragging.
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

## Map data and attribution

The default basemaps come from [OpenFreeMap](https://openfreemap.org/), with map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and tiles from [OpenMapTiles](https://www.openmaptiles.org/). OpenFreeMap's servers are paid for by donations; if p5.geo is useful to you, please consider [sponsoring OpenFreeMap](https://github.com/sponsors/hyperknot). p5.geo shows the required attribution on the map; please don't hide it.

## Related projects

- **[Unfolding Maps](http://unfoldingmaps.org/)**: The Processing library that inspired this project. Not an official port, and not API-compatible.
- **[p5.geolocation](https://github.com/bmoren/p5.geolocation)**: Gets the user's location. Get a position with p5.geolocation, draw it with p5.geo.
- **[Mappa](https://github.com/cvalenzuela/Mappa)**: An earlier p5.js mapping library. No longer maintained.

## Development

Requires Node.js 24 (see `.nvmrc`).

```sh
npm install
npm run dev       # rebuilds on change, serves http://localhost:8000/examples/
npm run dev:lan   # the same, reachable from a phone on the network
npm test          # unit tests, and checks that docs/api.md and the types are up to date
npm run build     # writes dist/
npm run docs      # regenerates docs/api.md from the JSDoc comments in src/
npm run docs:dev  # the documentation site
```

Some behavior needs a real browser: with `npm run dev` running, open http://localhost:8000/test/browser/ and check that every item passes.

Ideas, issues and pull requests are welcome.

## License

[MIT](LICENSE)
