// Type checks only (`npm run test:types`); never run.
import p5 from 'p5';
import geo, { GeoMap, project, geoPolygons, containsLatLon, STYLES, type LatLon } from '../../types/index.js';
import * as maplibregl from 'maplibre-gl';

p5.registerAddon(geo);

new p5((p: p5) => {
  let myMap: GeoMap;
  p.setup = () => {
    p.createCanvas(800, 600);
    myMap = p.createGeoMap({ maplibregl, basemap: STYLES.liberty });
  };
  p.draw = () => {
    const xy = project(35, 139, { lat: 35, lon: 139, zoom: 10, width: 800, height: 600 });
    const ll: LatLon = myMap.fromScreen(xy.x, xy.y);
    const inside: boolean = containsLatLon(geoPolygons({})[0], 35, 139);
    void [ll, inside];
  };
});
