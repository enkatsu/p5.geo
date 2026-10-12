// Entry point for bundlers (dist/p5.geo.esm.js). Doesn't import p5 or register anything:
//
//   import p5 from 'p5';
//   import geo from 'p5.geo';
//   p5.registerAddon(geo);
//
// The functions available as p5.geo in a sketch can also be imported by name.
export { default } from './addon.js';
export { GeoMap } from './geomap.js';
export { geoPoints, geoLines, geoPolygons, geoBounds } from './data.js';
export { containsLatLon } from './contains.js';
export {
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
} from './projection.js';
export { STYLES } from './styles.js';
export { VERSION } from './version.js';
