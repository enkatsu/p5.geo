// Type checks only (`npm run test:types`); never run.
import 'p5/global';
import type { GeoMap } from '../../types/global.js';

let myMap: GeoMap;

async function setup() {
  createCanvas(800, 600);
  const world = await loadJSON('world.geojson');
  const countries = geoPolygons(world);
  myMap = createGeoMap({ basemap: false });
  myMap.fit(countries);
}

function draw() {
  clear();
  const p = myMap.toScreen(35.6586, 139.7454);
  circle(p.x, p.y, 20);
}

void [setup, draw];
