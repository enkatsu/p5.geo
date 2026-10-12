# Changelog

All notable changes to p5.geo are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/): while p5.geo is at 0.x, patch releases (0.1.x) don't break existing sketches, and breaking changes bump the minor version.

## [Unreleased]

### Added

- `p5.geo.VERSION`, the version of p5.geo a sketch loaded (also `import { VERSION } from 'p5.geo'`).

### Removed

- `p5.GeoMap`, following the p5.js library guidelines (no classes on `p5` itself). Use the object `createGeoMap()` returns, or `import { GeoMap } from 'p5.geo'` with a bundler. No one was using it yet, so this went into a patch release.

## [0.1.1] - 2026-10-11

### Added

- Hit-testing for polygons: `myMap.isMouseOver(polygon)`, `myMap.contains(polygon, x, y)` and `p5.geo.containsLatLon(polygon, lat, lon)`. They follow the shapes as drawn with `toScreen()`, holes included.

## [0.1.0] - 2026-10-11

First release.

### Added

- `createGeoMap()`: a keyless basemap from OpenFreeMap behind the p5 canvas, rendered by MapLibre GL JS (loaded automatically from a CDN). Drawn shapes follow the map while dragging and zooming. `basemap: false` gives coordinate conversion without a map.
- `myMap.toScreen()` and `myMap.fromScreen()`, plus `center()`, `zoom()`, `flyTo()` and `fit()`.
- `myMap.interactive()` and the `interactive` option, to lock the map so the sketch can use the mouse.
- `geoPoints()`, `geoLines()` and `geoPolygons()`, which turn `loadTable()` and `loadJSON()` results (CSV and GeoJSON) into plain lists of coordinates.
- Projection functions independent of p5 and MapLibre, as `p5.geo`.
- Support for p5.js 2.x (global and instance mode), and loading in p5.js 1.x.
- An npm package for bundlers, with TypeScript types.

[Unreleased]: https://github.com/enkatsu/p5.geo/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/enkatsu/p5.geo/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/enkatsu/p5.geo/releases/tag/v0.1.0
