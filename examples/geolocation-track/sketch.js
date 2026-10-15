// Your location from the browser (it asks for permission), and the track you walk, on a map.
// Best on a phone, outdoors. The location stays in the browser; the map service only sees
// which map tiles are loaded around it.

let myMap;
let here = null; // { lat, lon, accuracy } once the browser reports a position
const track = []; // every position so far
let message = 'Waiting for your location…';

function setup() {
  createCanvas(windowWidth, windowHeight);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 3 });
  if (!navigator.geolocation) {
    message = "This browser can't share its location.";
    return;
  }
  navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true });
}

function onPosition(position) {
  const { latitude, longitude, accuracy } = position.coords;
  if (!here) myMap.flyTo(latitude, longitude, 16); // go to the first position
  here = { lat: latitude, lon: longitude, accuracy };
  track.push({ lat: latitude, lon: longitude });
  message = '';
}

function onError(error) {
  message = `Couldn't get your location: ${error.message}`;
}

function draw() {
  clear();

  // The track so far.
  noFill();
  stroke('#ff3366');
  strokeWeight(4);
  beginShape();
  for (const p of myMap.toScreen(track)) vertex(p.x, p.y);
  endShape();

  if (here) {
    const p = myMap.toScreen(here);
    // The position can be off by `accuracy` meters: draw a circle that size.
    // One degree of latitude is about 111,320 meters.
    const edge = myMap.toScreen(here.lat + here.accuracy / 111320, here.lon);
    const radius = dist(p.x, p.y, edge.x, edge.y);
    noStroke();
    fill(51, 102, 255, 40);
    circle(p.x, p.y, radius * 2);
    stroke(255);
    strokeWeight(3);
    fill('#3366ff');
    circle(p.x, p.y, 18);
  }

  noStroke();
  fill(0);
  textSize(16);
  const status = here ? `±${round(here.accuracy)} m · ${track.length} positions` : '';
  text(message || status, 16, height - 16);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
