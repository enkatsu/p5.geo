# Basemaps

## Map styles

```js
createGeoMap({ basemap: 'liberty' });
```

| `basemap` | |
|---|---|
| `'positron'` (default) | Light and quiet, so what you draw stands out. |
| `'liberty'` | A colorful, everyday map. |
| `'bright'` | Bright, with strong colors. |
| a URL | Any [MapLibre style](https://maplibre.org/maplibre-style-spec/), for example `'https://demotiles.maplibre.org/style.json'`. |
| `false` | No map: p5.geo only converts coordinates. |

The map can't be rotated or tilted, because shapes drawn on the canvas couldn't follow.

## No basemap

With `basemap: false`, nothing is added to the page. `toScreen()`, `fit()` and the rest work the same, so you can draw maps entirely with p5 shapes and style every pixel yourself:

```js
myMap = createGeoMap({ basemap: false });
myMap.fit(countries);
```

## Map data and attribution

The default basemaps come from [OpenFreeMap](https://openfreemap.org/), a free, keyless map service run by Zsolt Ero, with map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and tiles from [OpenMapTiles](https://www.openmaptiles.org/).

OpenFreeMap's servers are paid for by donations. If p5.geo is useful to you, or you use it in a class or a workshop, please consider [sponsoring OpenFreeMap](https://github.com/sponsors/hyperknot).

p5.geo shows the required attribution in the corner of the map, above your sketch. Please don't hide it. If you use another map provider, follow its terms.

## If the map stops loading

OpenFreeMap is a free service and comes with no guarantee that it will always be available. If the basemap stops appearing, your sketch keeps working, and you can switch to another map with the `basemap` option, or turn it off with `basemap: false`. Other providers' styles work the same way, though most of them need an API key. You can also host OpenFreeMap yourself: see [its repository](https://github.com/hyperknot/openfreemap).
