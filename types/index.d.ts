// Types for p5.geo with p5.js 2.x, for instance mode. For global mode, use "p5.geo/global".
// With a bundler, register the default export: `p5.registerAddon(geo)`.
//
// Known limitation: `p5.geo` and `p5.GeoMap` (static properties of the p5 class) aren't typed.
// p5's types expose the class only as a default export, and TypeScript can add instance members
// to it (`export default interface p5`) but not static ones. Use the `Geo` type with a cast:
//   const geo = (p5 as unknown as { geo: Geo }).geo;
// With a bundler, import them by name instead: `import { project } from 'p5.geo'`.
// The GeoMap class and the data and projection functions are generated from the JSDoc
// comments in src/ (`npm run types`); this file adds them to p5.
import type { GeoMap } from '../dist/types/geomap.js';
import type * as projection from '../dist/types/projection.js';
import type { geoPoints, geoLines, geoPolygons, geoBounds } from '../dist/types/data.js';
import type { STYLES } from '../dist/types/styles.js';

export { default } from '../dist/types/addon.js';
export { GeoMap, type LatLon } from '../dist/types/geomap.js';
export { geoPoints, geoLines, geoPolygons, geoBounds } from '../dist/types/data.js';
export {
  type View,
  TILE_SIZE,
  MAX_LATITUDE,
  lonToWorldX,
  latToWorldY,
  worldXToLon,
  worldYToLat,
  worldSize,
  project,
  projectPath,
  unproject,
  fitView,
} from '../dist/types/projection.js';
export { STYLES } from '../dist/types/styles.js';

/** Options for {@link createGeoMap}. See docs/api.md. */
export interface CreateGeoMapOptions {
  /** Where the map is centered: `[lat, lon]` or `{ lat, lon }` (`{ lat, lng }` also works). */
  center?: [number | string, number | string] | { lat: number | string; lon: number | string } | { lat: number | string; lng: number | string };
  /** Zoom level. Defaults to 2. */
  zoom?: number | string;
  /** A preset name, a MapLibre style URL or style object, or `false` for no map. Defaults to `'positron'`. */
  basemap?: 'positron' | 'liberty' | 'bright' | (string & {}) | object | false;
  /** Whether the map can be dragged and zoomed. Defaults to `true`. */
  interactive?: boolean;
  /** Extra options for maplibregl.Map. */
  mapOptions?: object;
  /** A MapLibre GL JS namespace to use instead of loading one. */
  maplibregl?: object;
}

/** The functions available as `p5.geo` (not typed on p5 itself; see the note at the top). */
export type Geo = Pick<
  typeof projection,
  | 'TILE_SIZE'
  | 'MAX_LATITUDE'
  | 'lonToWorldX'
  | 'latToWorldY'
  | 'worldXToLon'
  | 'worldYToLat'
  | 'worldSize'
  | 'project'
  | 'projectPath'
  | 'unproject'
  | 'fitView'
> & {
  geoBounds: typeof geoBounds;
  STYLES: typeof STYLES;
};

declare module 'p5' {
  // p5's class is only a default export, so it has to be augmented as one.
  export default interface p5 {
    /** Creates a map behind the canvas. See docs/api.md. */
    createGeoMap(options?: CreateGeoMapOptions): GeoMap;
    geoPoints: typeof geoPoints;
    geoLines: typeof geoLines;
    geoPolygons: typeof geoPolygons;
  }
}
