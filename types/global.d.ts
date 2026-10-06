// Types for p5.geo's global-mode functions, alongside "p5/global".
import type { GeoMap } from '../dist/types/geomap.js';
import type { geoPoints as _geoPoints, geoLines as _geoLines, geoPolygons as _geoPolygons } from '../dist/types/data.js';
import type { CreateGeoMapOptions } from './index.js';

export * from './index.js';

declare global {
  /** Creates a map behind the canvas. See docs/api.md. */
  function createGeoMap(options?: CreateGeoMapOptions): GeoMap;
  var geoPoints: typeof _geoPoints;
  var geoLines: typeof _geoLines;
  var geoPolygons: typeof _geoPolygons;
}
