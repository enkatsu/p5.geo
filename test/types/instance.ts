// Type checks only (`npm run test:types`); never run.
import p5 from 'p5';
import type { GeoMap, LatLon, Geo } from '../../types/index.js';

new p5((p: p5) => {
  let myMap: GeoMap;
  let places: Array<{ lat: number; lon: number; properties: Record<string, unknown> }>;

  p.setup = async () => {
    p.createCanvas(800, 600);
    const table = await p.loadTable('places.csv', ',', 'header');
    places = p.geoPoints(table);
    myMap = p.createGeoMap({ center: [35.68, 139.76], zoom: 12, basemap: 'liberty', interactive: true });
    myMap.fit(places, { padding: 10 });
  };

  p.draw = () => {
    p.clear();
    const v: p5.Vector = myMap.toScreen(35.6586, 139.7454);
    p.circle(v.x, v.y, 20);
    const fromStrings: p5.Vector = myMap.toScreen('35.6586', '139.7454');
    const list: p5.Vector[] = myMap.toScreen([{ lat: 35, lon: 139 }]);
    const z: number = myMap.zoom() * 2;
    const c: LatLon = myMap.center();
    myMap.center(35, 139).zoom(10).flyTo(35, 139, 8).interactive(false);
    const locked: boolean = !myMap.interactive();
    const saving: Promise<void> = myMap.saveCanvas('my-map', 'png');
    void saving;
    const over: boolean = myMap.isMouseOver([{ lat: 35, lon: 139 }]) || myMap.contains({ outer: [], holes: [] }, 10, 10)
      || myMap.isMouseOver({ path: [{ lat: 35, lon: 139 }] }, 4) || myMap.contains({ lat: 35, lon: 139 }, 10, 10, 12);
    void over;
    const here: LatLon = myMap.fromScreen(p.mouseX, p.mouseY);
    // p5.geo isn't typed on p5 itself (see types/index.d.ts); the Geo type covers it.
    const geo = (p5 as unknown as { geo: Geo }).geo;
    const xy = geo.project(35, 139, { lat: 35, lon: 139, zoom: 10, width: 800, height: 600 });
    const n: number = xy.x + geo.TILE_SIZE;
    void [fromStrings, list, z, c, here, n, locked];
  };
});

// @ts-expect-error zoom() with no argument returns a number, not a GeoMap
new p5((p: p5) => p.createGeoMap().zoom().center());
// @ts-expect-error basemap must be a preset, URL, style object or false
new p5((p: p5) => p.createGeoMap({ basemap: 42 }));
