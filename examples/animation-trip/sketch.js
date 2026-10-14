// Animation: a point travels from city to city across Japan, and the map follows it.
// No data files needed.

const cities = [
  { name: 'Sapporo', lat: 43.0618, lon: 141.3545 },
  { name: 'Sendai', lat: 38.2682, lon: 140.8694 },
  { name: 'Tokyo', lat: 35.6812, lon: 139.7671 },
  { name: 'Nagoya', lat: 35.1709, lon: 136.8815 },
  { name: 'Osaka', lat: 34.7025, lon: 135.4959 },
  { name: 'Hiroshima', lat: 34.3978, lon: 132.4753 },
  { name: 'Fukuoka', lat: 33.5902, lon: 130.4207 },
];
const LEG_SECONDS = 3;

let myMap;
let leg = 0; // traveling from cities[leg] to cities[leg + 1]
let legStart = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // The sketch moves the map, so it can't be dragged.
  myMap = createGeoMap({ center: [cities[0].lat, cities[0].lon], zoom: 7, interactive: false });
}

function draw() {
  clear();

  // How far along this leg we are, eased so the point slows down at each city.
  let t = (millis() - legStart) / 1000 / LEG_SECONDS;
  if (t >= 1) {
    leg = (leg + 1) % (cities.length - 1);
    legStart = millis();
    t = 0;
  }
  const from = cities[leg];
  const to = cities[leg + 1];
  const e = t < 0.5 ? 2 * t * t : 1 - pow(2 - 2 * t, 2) / 2;
  const here = { lat: lerp(from.lat, to.lat, e), lon: lerp(from.lon, to.lon, e) };

  // Keep the traveler in the middle of the map.
  myMap.center(here);

  // The whole route, and the part already traveled.
  noFill();
  strokeWeight(3);
  stroke(0, 60);
  beginShape();
  for (const p of myMap.toScreen(cities)) vertex(p.x, p.y);
  endShape();
  stroke('#ff3366');
  beginShape();
  for (const p of myMap.toScreen([...cities.slice(0, leg + 1), here])) vertex(p.x, p.y);
  endShape();

  // The cities, and the traveler.
  for (const city of cities) {
    const p = myMap.toScreen(city);
    stroke(255);
    strokeWeight(2);
    fill(0);
    circle(p.x, p.y, 10);
    noStroke();
    textSize(14);
    text(city.name, p.x + 10, p.y - 8);
  }
  const p = myMap.toScreen(here);
  stroke(255);
  strokeWeight(3);
  fill('#ff3366');
  circle(p.x, p.y, 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
