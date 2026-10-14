// The basics: points written right in the sketch, drawn with circle() on top of a map.
// No data files needed. Drag and scroll the map: the points follow. Hover a point to see its name.

const places = [
  { name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454 },
  { name: 'Tokyo Skytree', lat: 35.7101, lon: 139.8107 },
  { name: 'Tokyo Station', lat: 35.6812, lon: 139.7671 },
  { name: 'Shibuya Station', lat: 35.658, lon: 139.7016 },
  { name: 'Shinjuku Station', lat: 35.6896, lon: 139.7006 },
  { name: 'Ueno Park', lat: 35.7156, lon: 139.7745 },
  { name: 'Senso-ji', lat: 35.7148, lon: 139.7967 },
  { name: 'Meiji Jingu', lat: 35.6764, lon: 139.6993 },
  { name: 'Rainbow Bridge', lat: 35.6365, lon: 139.7633 },
];

let myMap;

function setup() {
  createCanvas(windowWidth, windowHeight);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 11 });
}

function draw() {
  clear();

  for (const place of places) {
    const p = myMap.toScreen(place.lat, place.lon);
    const hovered = myMap.isMouseOver(place, 10); // within 10 pixels

    stroke(255);
    strokeWeight(2);
    fill(hovered ? '#ff3366' : '#3366ff');
    circle(p.x, p.y, hovered ? 24 : 16);

    if (hovered) {
      noStroke();
      fill(0);
      textSize(14);
      text(place.name, p.x + 16, p.y + 5);
    }
  }
}

// The map follows the canvas size.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
