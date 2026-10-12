# Getting started

## Add p5.geo to a sketch

Add p5.geo after p5.js in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2/lib/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.geo@0.1/dist/p5.geo.min.js"></script>
```

In the [p5.js Web Editor](https://editor.p5js.org/), open `index.html` from the sketch's file list and paste the second line below the line that loads p5.js. Nothing else is needed: no API key, no install.

## Draw on a map

```js
let myMap;

function setup() {
  createCanvas(800, 600);
  myMap = createGeoMap({ center: [35.68, 139.76], zoom: 12 });
}

function draw() {
  clear();
  const p = myMap.toScreen(35.6586, 139.7454); // Tokyo Tower
  circle(p.x, p.y, 20);
}
```

`createGeoMap()` puts a map behind the canvas. `myMap.toScreen(lat, lon)` turns a latitude and longitude into a position on the canvas, as a `p5.Vector`, so you can draw there with any p5 function. Drag and scroll the map: the circle stays on Tokyo Tower.

<Example name="basic" />

## A few things to know

- **Latitude first.** Coordinates are always given as latitude, longitude, in that order: `toScreen(35.68, 139.76)`, `center: [35.68, 139.76]`.
- **Call `clear()`, not `background()`,** at the start of `draw()`. The canvas sits on top of the map, so a background would hide it.
- **Don't name your map `map`.** A variable called `map` hides p5's own [`map()`](https://p5js.org/reference/p5/map/) function. These docs use `myMap`.
- **p5.js 2.x** is what p5.geo targets. It also loads in p5.js 1.x, but the examples and docs use 2.x.
- **`WEBGL` canvases** put (0, 0) in the middle. `toScreen()` measures from the top-left corner, like `mouseX`, so call `translate(-width / 2, -height / 2)` before drawing.

## Next

- [Loading data](./data): points from a CSV, shapes from GeoJSON.
- [Mouse and hit-testing](./interaction): highlight what's under the mouse, or lock the map.
- [Basemaps](./basemaps): other map styles, or no map at all.
- [Reference](../api): every function and option.
