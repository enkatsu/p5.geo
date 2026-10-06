import { describe, it, expect, vi } from 'vitest';
import { GeoMap } from '../src/geomap.js';

// Just enough of a p5 instance for a map without a basemap (no DOM involved).
function fakeP5({ looping = true } = {}) {
  return {
    width: 800,
    height: 600,
    createVector: (x, y) => ({ x, y }),
    isLooping: () => looping,
    redraw: vi.fn(),
  };
}

const options = { center: [35.68, 139.76], zoom: 12, basemap: false };

describe('GeoMap without a basemap', () => {
  it('converts coordinates right away', async () => {
    const map = new GeoMap(fakeP5(), options);
    const p = map.toScreen(35.68, 139.76);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(300);
    expect(await map.ready).toBe(map);
    expect(map.maplibre).toBeNull();
  });

  it('accepts the center as [lat, lon], { lat, lon } or { lat, lng }', () => {
    for (const center of [[35.68, 139.76], { lat: 35.68, lon: 139.76 }, { lat: 35.68, lng: 139.76 }]) {
      const map = new GeoMap(fakeP5(), { ...options, center });
      expect(map.center()).toEqual({ lat: 35.68, lon: 139.76 });
    }
  });

  it('gets and sets the center and zoom p5-style', () => {
    const map = new GeoMap(fakeP5(), options);
    expect(map.zoom()).toBe(12);
    expect(map.zoom(14)).toBe(map);
    expect(map.zoom()).toBe(14);
    map.center(35.6586, 139.7454);
    expect(map.center()).toEqual({ lat: 35.6586, lon: 139.7454 });
    map.center([35, 139]);
    expect(map.center()).toEqual({ lat: 35, lon: 139 });
    expect(map.toScreen(35, 139).x).toBeCloseTo(400);
  });

  it('jumps on flyTo', () => {
    const map = new GeoMap(fakeP5(), options);
    map.flyTo(34.69, 135.5, 10);
    expect(map.center()).toEqual({ lat: 34.69, lon: 135.5 });
    expect(map.zoom()).toBe(10);
  });

  it('redraws a noLoop() sketch when the view changes', () => {
    const p = fakeP5({ looping: false });
    const map = new GeoMap(p, options);
    map.zoom(13);
    expect(p.redraw).toHaveBeenCalledTimes(1);
  });

  it('follows the canvas size', () => {
    const p = fakeP5();
    const map = new GeoMap(p, options);
    p.width = 400;
    p.height = 400;
    map._beforeDraw();
    const c = map.toScreen(35.68, 139.76);
    expect(c.x).toBeCloseTo(200);
    expect(c.y).toBeCloseTo(200);
  });
});

describe('GeoMap data helpers', () => {
  it('toScreen takes { lat, lon }, [lat, lon] and lists of points', () => {
    const map = new GeoMap(fakeP5(), options);
    expect(map.toScreen({ lat: 35.68, lon: 139.76 }).x).toBeCloseTo(400);
    expect(map.toScreen([35.68, 139.76]).y).toBeCloseTo(300);
    const list = map.toScreen([{ lat: 35.68, lon: 139.76 }, { lat: 35.68, lon: 139.76 }]);
    expect(list).toHaveLength(2);
    expect(list[1].x).toBeCloseTo(400);
  });

  it('fit() puts the data on screen', () => {
    const map = new GeoMap(fakeP5(), options);
    const points = [{ lat: 34, lon: 135 }, { lat: 36, lon: 140 }];
    map.fit(points, { padding: 10 });
    for (const p of map.toScreen(points)) {
      expect(p.x).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(p.x).toBeLessThanOrEqual(790 + 1e-6);
      expect(p.y).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(p.y).toBeLessThanOrEqual(590 + 1e-6);
    }
  });
});

describe('GeoMap with strings', () => {
  it('accepts numeric strings, such as table.getString() results', () => {
    const map = new GeoMap(fakeP5(), options);
    const expected = map.toScreen(35.6586, 139.7454);
    for (const p of [
      map.toScreen('35.6586', '139.7454'),
      map.toScreen(' 35.6586 ', '139.7454'),
      map.toScreen({ lat: '35.6586', lon: '139.7454' }),
      map.toScreen(['35.6586', '139.7454']),
      map.toScreen([{ lat: '35.6586', lng: '139.7454' }])[0],
    ]) {
      expect(p.x).toBeCloseTo(expected.x, 9);
      expect(p.y).toBeCloseTo(expected.y, 9);
    }
  });

  it('accepts numeric strings in setters and options', () => {
    const map = new GeoMap(fakeP5(), { center: ['35.68', '139.76'], zoom: '12', basemap: false });
    expect(map.center()).toEqual({ lat: 35.68, lon: 139.76 });
    expect(map.zoom()).toBe(12);
    map.center('34.69', '135.5').zoom('10');
    expect(map.center()).toEqual({ lat: 34.69, lon: 135.5 });
    expect(map.zoom()).toBe(10);
    map.flyTo('35', '139', '8');
    expect(map.center()).toEqual({ lat: 35, lon: 139 });
    expect(map.zoom()).toBe(8);
    const ll = map.fromScreen('400', '300');
    expect(ll.lat).toBeCloseTo(35);
    expect(ll.lon).toBeCloseTo(139);
  });

  it('warns once, naming the argument, when a value is not a number', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = new GeoMap(fakeP5(), options);
    for (let i = 0; i < 3; i++) expect(map.toScreen('abc', 139.7).y).toBeNaN();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('p5.geo: toScreen() expected a number for lat, but got "abc".');
    map.toScreen(35, '');
    expect(warn).toHaveBeenLastCalledWith('p5.geo: toScreen() expected a number for lon, but got "".');
    map.toScreen(undefined);
    expect(warn).toHaveBeenLastCalledWith('p5.geo: toScreen() expected a latitude and longitude, but got undefined.');
    warn.mockRestore();
  });

  it('warns once per argument, however many different bad values arrive', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = new GeoMap(fakeP5(), options);
    for (const bad of ['N/A1', 'N/A2', 'N/A3']) map.fromScreen(bad, 300);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('p5.geo: fromScreen() expected a number for x, but got "N/A1".');
    map.fromScreen(400, 'oops');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('never throws, even when the core would', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = new GeoMap(fakeP5(), options);
    expect(() => map.toScreen('', null)).not.toThrow();
    expect(() => map.toScreen([{ lat: 'x', lon: 139 }])).not.toThrow();
    expect(() => map.fit([{ lat: 35, lon: 139 }, { lat: 36, lon: 140 }], { padding: '10' })).not.toThrow();
    expect(map.zoom()).toBeGreaterThan(0);
    warn.mockRestore();
  });

  it('still treats an empty list as a list', () => {
    expect(new GeoMap(fakeP5(), options).toScreen([])).toEqual([]);
  });
});

describe('GeoMap interactive', () => {
  it('defaults to interactive, and takes the option', () => {
    expect(new GeoMap(fakeP5(), options).interactive()).toBe(true);
    expect(new GeoMap(fakeP5(), { ...options, interactive: false }).interactive()).toBe(false);
    expect(new GeoMap(fakeP5(), { ...options, mapOptions: { interactive: false } }).interactive()).toBe(false);
    expect(new GeoMap(fakeP5(), { ...options, interactive: true, mapOptions: { interactive: false } }).interactive()).toBe(true);
  });

  it('gets and sets p5-style', () => {
    const map = new GeoMap(fakeP5(), options);
    expect(map.interactive(false)).toBe(map);
    expect(map.interactive()).toBe(false);
    map.interactive(true);
    expect(map.interactive()).toBe(true);
  });
});
