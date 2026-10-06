// Manual check on a phone: can the map be dragged and pinched, do the points follow, and does
// the canvas follow rotation (windowResized)? Variants define p5 handlers that return false,
// which makes p5 call preventDefault() on the pointer events.
const params = new URLSearchParams(location.search);
for (const a of document.querySelectorAll('#panel a')) {
  if (a.getAttribute('href') === (location.search || '?')) a.classList.add('current');
}

const places = [
  { name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454 },
  { name: 'Tokyo Skytree', lat: 35.7101, lon: 139.8107 },
  { name: 'Tokyo Station', lat: 35.6812, lon: 139.7671 },
  { name: 'Shibuya', lat: 35.658, lon: 139.7016 },
  { name: 'Shinjuku', lat: 35.6896, lon: 139.7006 },
];

let myMap;
let presses = 0;
let drags = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 11 });
}

function draw() {
  clear();
  stroke(255);
  strokeWeight(2);
  fill('#3366ff');
  for (const place of places) {
    const p = myMap.toScreen(place.lat, place.lon);
    circle(p.x, p.y, 20);
  }
  const c = myMap.center();
  document.getElementById('status').textContent =
    `canvas ${width}×${height} · zoom ${myMap.zoom().toFixed(2)} · center ${c.lat.toFixed(3)}, ${c.lon.toFixed(3)} · ` +
    `sketch saw ${presses} presses, ${drags} drags`;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  presses++;
  if (params.get('pressed') === 'false') return false;
}

function mouseDragged() {
  drags++;
  if (params.get('drag') === 'false') return false;
}
