// Loading GeoJSON from the web: a world map drawn entirely with p5 shapes, no basemap.
// Countries are colored by GDP per person (Natural Earth data). Hover a country to see its numbers.

const DATA_URL =
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson';

let myMap;
let countries;

async function setup() {
  createCanvas(960, 540);
  const world = await loadJSON(DATA_URL);
  countries = geoPolygons(world); // [{ outer, holes, properties }, ...]
  // Antarctica looks enormous in this projection, so leave it out.
  countries = countries.filter((c) => c.properties.NAME !== 'Antarctica');
  myMap = createGeoMap({ basemap: false });
  myMap.fit(countries); // center and zoom so the whole world fits
}

function draw() {
  background('#dfe8ef');
  stroke(255);
  strokeWeight(0.5);

  // Find the country under the mouse first. A country made of several polygons (islands, for
  // example) shares one properties object, so all of its parts can light up together.
  const hovered = countries.find((c) => myMap.isMouseOver(c))?.properties;

  for (const country of countries) {
    const { GDP_MD, POP_EST } = country.properties;
    const perPerson = (GDP_MD * 1e6) / POP_EST;
    // Log scale: $500 → light, $100,000 → dark.
    const t = constrain(map(log(perPerson), log(500), log(100000), 0, 1), 0, 1);
    fill(POP_EST > 0 ? lerpColor(color('#f2e6c9'), color('#1b5e7a'), t) : 200);
    if (country.properties === hovered) fill('#ff7a59');

    beginShape();
    for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
    for (const hole of country.holes) {
      beginContour();
      for (const p of myMap.toScreen(hole)) vertex(p.x, p.y);
      endContour();
    }
    endShape(CLOSE);
  }

  if (hovered) {
    const { NAME, GDP_MD, POP_EST } = hovered;
    const perPerson = POP_EST > 0 ? `$${Math.round((GDP_MD * 1e6) / POP_EST).toLocaleString('en-US')} per person` : 'no data';
    noStroke();
    fill(0);
    textSize(16);
    text(`${NAME}: ${perPerson}`, 16, height - 16);
  }
}
