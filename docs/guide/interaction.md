# Mouse and hit-testing

## Is the mouse over a shape?

`myMap.isMouseOver(polygon)` tells whether the mouse is over a polygon from `geoPolygons()`, following the shape as it's drawn, holes included:

```js
for (const country of countries) {
  fill(myMap.isMouseOver(country) ? 'tomato' : 'white');
  beginShape();
  for (const p of myMap.toScreen(country.outer)) vertex(p.x, p.y);
  endShape(CLOSE);
}
```

For lines and points, give a distance in pixels (5 for lines and 10 for points if you leave it out):

```js
myMap.isMouseOver(river, 4); // within 4 pixels of a line from geoLines()
myMap.isMouseOver(place, 10); // within 10 pixels of a point, such as the radius of its circle
```

`isMouseOver()` is `false` while the mouse is outside the canvas. To test another position, such as a touch, use `myMap.contains(item, x, y, distance)`.

To ask about the data itself rather than the screen, such as which country an earthquake was in, use `p5.geo.containsLatLon(polygon, lat, lon)`.

## Locking the map

By default, dragging on the canvas moves the map, and the sketch's `mousePressed()` and `mouseDragged()` are called too. If the sketch should have the mouse to itself, for drawing for example, lock the map:

```js
myMap = createGeoMap({ center: [35.68, 139.76], zoom: 12, interactive: false });
```

or switch it at any time:

```js
function keyPressed() {
  if (key === 'l') myMap.interactive(!myMap.interactive()); // press L to lock or unlock
}
```

A locked map can still be moved by the sketch, with `center()`, `zoom()`, `flyTo()` and `fit()`.

Returning `false` from `mousePressed()` stops the browser from passing the press on, and the map can then no longer be dragged with the mouse. p5.geo points this out in the console. If that's what you want, use `interactive: false` instead.
