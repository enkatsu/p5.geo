// Loading a CSV from the web: earthquakes of magnitude 4.5+ from the past month, live from the USGS.
// geoPoints() finds the latitude/longitude columns by name.
// Circle size shows magnitude, color shows depth (shallow = yellow, deep = purple).

const DATA_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.csv';

let myMap;
let quakes;

async function setup() {
  createCanvas(960, 540);
  const table = await loadTable(DATA_URL, ',', 'header');
  quakes = geoPoints(table); // finds the latitude/longitude columns by name
  myMap = createGeoMap({ center: [20, 150], zoom: 1.2, basemap: 'positron' });
}

function draw() {
  clear();
  noStroke();

  for (const q of quakes) {
    const p = myMap.toScreen(q);
    const { mag, depth } = q.properties;
    const size = pow(2, mag - 4) * 4; // M4.5 ≈ 6px, each +1 doubles it
    const c = lerpColor(color('#ffd23f'), color('#5f0f99'), constrain(depth / 300, 0, 1));
    c.setAlpha(170);
    fill(c);
    circle(p.x, p.y, size);
  }

  fill(0);
  textSize(13);
  text(`${quakes.length} earthquakes (M4.5+, past 30 days) · USGS`, 10, height - 12);
}
