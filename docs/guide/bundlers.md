# Using with a bundler

p5.geo is mainly meant for a `<script>` tag, where it registers itself. With a bundler such as Vite, install it from npm and register it yourself, as with any p5.js 2.x addon:

```sh
npm install p5 p5.geo
```

```js
import p5 from 'p5';
import geo from 'p5.geo';

p5.registerAddon(geo);

new p5((p) => {
  let myMap;
  p.setup = () => {
    p.createCanvas(800, 600);
    myMap = p.createGeoMap({ center: [35.68, 139.76], zoom: 12 });
  };
});
```

The functions available as `p5.geo` in a sketch can also be imported by name, for example `import { project, containsLatLon } from 'p5.geo'`.

## Bundling MapLibre

MapLibre GL JS, which draws the basemap, still loads from a CDN by default. To bundle it instead, install `maplibre-gl` and pass it in. p5.geo then leaves its CSS to you. MapLibre runs a worker from a separate file that bundlers don't pick up on their own; with Vite:

```js
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(workerUrl);
const myMap = p.createGeoMap({ maplibregl });
```

## TypeScript

Types are included. `import 'p5.geo'` types instance mode and the named exports; `import 'p5.geo/global'` types global mode (`createGeoMap()` and friends as globals). `p5.geo` itself isn't typed on the p5 class, so import those functions by name.
