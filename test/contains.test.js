import { describe, it, expect, vi } from 'vitest';
import { containsLatLon } from '../src/contains.js';
import { geoPolygons } from '../src/data.js';
import { GeoMap } from '../src/geomap.js';

const ring = (coords) => coords.map(([lat, lon]) => ({ lat, lon }));

// A 10°×10° square with a 2°×2° hole in the middle.
const square = {
  outer: ring([[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]),
  holes: [ring([[4, 4], [4, 6], [6, 6], [6, 4], [4, 4]])],
};

function fakeP5(props = {}) {
  return { width: 800, height: 600, createVector: (x, y) => ({ x, y }), isLooping: () => true, redraw() {}, ...props };
}

// Even-odd test on screen positions, as a reference for what toScreen() draws.
function inScreenRing(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

describe('containsLatLon', () => {
  it('is true inside the outline and false in holes and outside', () => {
    expect(containsLatLon(square, 2, 2)).toBe(true);
    expect(containsLatLon(square, 5, 5)).toBe(false); // in the hole
    expect(containsLatLon(square, 11, 5)).toBe(false);
    expect(containsLatLon(square, 5, -1)).toBe(false);
  });

  it('accepts a plain outline', () => {
    expect(containsLatLon(square.outer, 5, 5)).toBe(true);
  });

  it('works on the items from geoPolygons(), one per part of a MultiPolygon', () => {
    const [a, b] = geoPolygons({
      type: 'Feature',
      properties: { name: 'two islands' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          [[[10, 10], [11, 10], [11, 11], [10, 11], [10, 10]]],
        ],
      },
    });
    expect(containsLatLon(a, 0.5, 0.5)).toBe(true);
    expect(containsLatLon(b, 0.5, 0.5)).toBe(false);
    expect(containsLatLon(b, 10.5, 10.5)).toBe(true);
  });

  it('follows straight edges on the map, not in latitude/longitude', () => {
    // A long diagonal edge from (0°, 0°) to (60°, 60°): on Web Mercator the straight edge bows
    // away from the lat/lon diagonal, so (31°, 30°) is on the other side of it.
    const triangle = ring([[0, 0], [60, 60], [0, 60], [0, 0]]);
    expect(containsLatLon(triangle, 31, 30)).toBe(true);
  });

  it('is strict, like the other p5.geo functions', () => {
    expect(() => containsLatLon(square, '2', 2)).toThrow('p5.geo.containsLatLon(): lat must be a number, but got "2".');
    expect(() => containsLatLon({ type: 'Polygon' }, 2, 2)).toThrow(/polygon must be an item from geoPolygons/);
  });
});

describe('GeoMap#contains and #isMouseOver', () => {
  const view = { center: [5, 5], zoom: 4, basemap: false };

  it('matches the shape toScreen() draws', () => {
    const map = new GeoMap(fakeP5(), view);
    const outline = map.toScreen(square.outer);
    const hole = map.toScreen(square.holes[0]);
    for (let x = 0; x < 800; x += 37) {
      for (let y = 0; y < 600; y += 29) {
        const expected = inScreenRing(outline, x, y) && !inScreenRing(hole, x, y);
        expect(map.contains(square, x, y), `${x}, ${y}`).toBe(expected);
      }
    }
  });

  it('works on the world copy toScreen() uses across the antimeridian', () => {
    // Centered on the Pacific, Chile is drawn to the east of the center, not 220° west.
    const chile = ring([[-20, -75], [-20, -65], [-40, -65], [-40, -75], [-20, -75]]);
    const map = new GeoMap(fakeP5(), { center: [-30, 150], zoom: 1, basemap: false });
    const p = map.toScreen(-30, -70);
    expect(p.x).toBeGreaterThan(400);
    expect(map.contains(chile, p.x, p.y)).toBe(true);
  });

  it('isMouseOver() uses the mouse, and is false off the canvas', () => {
    const p = fakeP5({ mouseX: 0, mouseY: 0 });
    const map = new GeoMap(p, view);
    const inside = map.toScreen(2, 2);
    Object.assign(p, { mouseX: inside.x, mouseY: inside.y });
    expect(map.isMouseOver(square)).toBe(true);
    const inHole = map.toScreen(5, 5);
    Object.assign(p, { mouseX: inHole.x, mouseY: inHole.y });
    expect(map.isMouseOver(square)).toBe(false);
    // A huge polygon covers the whole canvas, but the mouse is outside it.
    const everywhere = ring([[-80, -170], [-80, 170], [80, 170], [80, -170], [-80, -170]]);
    Object.assign(p, { mouseX: -5, mouseY: 300 });
    expect(map.isMouseOver(everywhere)).toBe(false);
  });

  it('accepts numeric strings, and warns once instead of throwing on bad input', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = new GeoMap(fakeP5({ mouseX: -1, mouseY: -1 }), view);
    const p = map.toScreen(2, 2);
    expect(map.contains(square, String(p.x), String(p.y))).toBe(true);
    expect(map.contains({ type: 'Feature' }, 1, 1)).toBe(false);
    expect(map.isMouseOver(undefined)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/expected an item from geoPolygons\(\)/);
    expect(map.contains(ring([[0, 0], ['x', 1], [1, 1]]), 1, 1)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
