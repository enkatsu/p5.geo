// Lines from GeoJSON: the world's major rivers, drawn with p5 on a dark background, no basemap.
// Natural Earth data. Bigger rivers are drawn thicker.

const DATA_URL =
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_50m_rivers_lake_centerlines.geojson';

let myMap;
let rivers;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  const data = await loadJSON(DATA_URL);
  rivers = geoLines(data); // [{ path, properties }, ...]
  myMap = createGeoMap({ basemap: false });
  myMap.fit(rivers);
}

function draw() {
  background('#0b1a2a');
  noFill();
  stroke(120, 190, 255, 200);

  for (const river of rivers) {
    // scalerank goes from 1 (the largest rivers) to 6.
    strokeWeight(map(river.properties.scalerank, 1, 6, 3, 0.6));
    beginShape();
    for (const p of myMap.toScreen(river.path)) vertex(p.x, p.y);
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (myMap) myMap.fit(rivers);
}
