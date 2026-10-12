// Manual check on a phone: does tapping a polygon make isMouseOver() true?
// Shows what p5 received (mouseX, mouseY, touches) and the last pointer events from the browser.
// ?basemap=1 puts the polygons on a MapLibre basemap, where the map also handles touches.
const params = new URLSearchParams(location.search);
const withBasemap = params.get('basemap') === '1';

// Three squares around Tokyo, big enough to tap.
const square = (lat, lon, r) => [
  { lat: lat - r, lon: lon - r }, { lat: lat - r, lon: lon + r },
  { lat: lat + r, lon: lon + r }, { lat: lat + r, lon: lon - r }, { lat: lat - r, lon: lon - r },
];
const shapes = [square(35.62, 139.68, 0.03), square(35.68, 139.76, 0.03), square(35.74, 139.84, 0.03)];

const events = [];
for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'click']) {
  window.addEventListener(type, (e) => {
    events.unshift(`${type}${e.pointerType ? ` (${e.pointerType})` : ''} at ${Math.round(e.clientX ?? e.changedTouches?.[0]?.clientX)},${Math.round(e.clientY ?? e.changedTouches?.[0]?.clientY)}`);
    events.length = Math.min(events.length, 6);
  }, { capture: true, passive: true });
}

let myMap;

function setup() {
  createCanvas(windowWidth, windowHeight);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 11, basemap: withBasemap ? 'positron' : false });
}

function draw() {
  if (withBasemap) clear();
  else background(240);
  const over = shapes.map((s) => myMap.isMouseOver(s));
  stroke(0);
  shapes.forEach((s, i) => {
    fill(over[i] ? 'tomato' : 'white');
    beginShape();
    for (const p of myMap.toScreen(s)) vertex(p.x, p.y);
    endShape(CLOSE);
  });
  noStroke();
  fill('blue');
  circle(mouseX, mouseY, 12); // where p5 thinks the pointer is

  document.getElementById('panel').textContent =
    `p5.geo ${typeof myMap.isMouseOver === 'function' ? 'has isMouseOver' : 'has NO isMouseOver (old version?)'} · basemap ${withBasemap ? 'on' : 'off'} (?basemap=1)\n` +
    `canvas ${width}×${height} · mouseX ${mouseX.toFixed(0)} mouseY ${mouseY.toFixed(0)} · touches ${touches.length}\n` +
    `isMouseOver: ${over.map((o) => (o ? 'YES' : 'no')).join(' / ')}\n` +
    `last events:\n${events.join('\n')}`;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
