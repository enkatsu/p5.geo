import { describe, it, expect } from 'vitest';
import { project, projectPath, unproject, latToWorldY, worldYToLat, TILE_SIZE } from '../src/projection.js';

const view = { lat: 35.68, lon: 139.76, zoom: 12, width: 800, height: 600 };

describe('project', () => {
  it('puts the center in the middle of the screen', () => {
    const p = project(view.lat, view.lon, view);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(300);
  });

  it('maps the whole world to TILE_SIZE pixels at zoom 0', () => {
    const v = { lat: 0, lon: 0, zoom: 0, width: TILE_SIZE, height: TILE_SIZE };
    expect(project(0, -179.999999, v).x).toBeCloseTo(0, 3);
    expect(project(85.051128779806604, 0, v).y).toBeCloseTo(0, 6);
    expect(project(-85.051128779806604, 0, v).y).toBeCloseTo(TILE_SIZE, 6);
  });

  it('puts north up and east right', () => {
    const p = project(35.7, 139.8, view);
    expect(p.x).toBeGreaterThan(400);
    expect(p.y).toBeLessThan(300);
  });

  it('doubles distances per zoom level', () => {
    const a = project(35.7, 139.8, view);
    const b = project(35.7, 139.8, { ...view, zoom: 13 });
    expect(b.x - 400).toBeCloseTo(2 * (a.x - 400));
    expect(b.y - 300).toBeCloseTo(2 * (a.y - 300));
  });

  it('uses the world copy nearest the center across the antimeridian', () => {
    const v = { lat: 0, lon: 150, zoom: 1, width: 800, height: 600 };
    // Chile is 140° east of the center going across the Pacific, not 220° west.
    expect(project(-33, -70, v).x).toBeCloseTo(400 + (140 / 360) * 1024);
  });
});

describe('projectPath', () => {
  it('keeps a shape in one piece on the far side of the world', () => {
    const v = { lat: 0, lon: 139, zoom: 1, width: 800, height: 600 };
    // Greenland straddles 41°W, exactly opposite Japan; per-point wrapping would tear it.
    const [west, east] = projectPath([{ lat: 70, lon: -73 }, { lat: 70, lon: -12 }], v);
    expect(east.x - west.x).toBeCloseTo((61 / 360) * 1024);
  });

  it('moves the whole shape to the copy nearest the center', () => {
    const v = { lat: 0, lon: 150, zoom: 1, width: 800, height: 600 };
    const path = projectPath([{ lat: -20, lon: -75 }, { lat: -40, lon: -65 }], v);
    expect(path[0].x).toBeCloseTo(project(-20, -75, v).x);
    expect(path[1].x).toBeCloseTo(project(-40, -65, v).x);
  });

  it('matches project() near the center', () => {
    const [p] = projectPath([{ lat: 35.6586, lon: 139.7454 }], view);
    const q = project(35.6586, 139.7454, view);
    expect(p.x).toBeCloseTo(q.x, 9);
    expect(p.y).toBeCloseTo(q.y, 9);
  });
});

describe('unproject', () => {
  it('inverts project', () => {
    for (const [lat, lon] of [[35.6586, 139.7454], [35.6, 139.9], [35.75, 139.6]]) {
      const p = project(lat, lon, view);
      const ll = unproject(p.x, p.y, view);
      expect(ll.lat).toBeCloseTo(lat, 9);
      expect(ll.lon).toBeCloseTo(lon, 9);
    }
  });

  it('normalizes longitude to [-180, 180)', () => {
    const v = { lat: 0, lon: 179, zoom: 4, width: 800, height: 600 };
    const ll = unproject(800, 300, v);
    expect(ll.lon).toBeCloseTo(179 + (400 / (TILE_SIZE * 16)) * 360 - 360, 9);
  });
});

describe('mercator helpers', () => {
  it('round-trips latitude', () => {
    for (const lat of [-80, -35.5, 0, 12.3, 85]) {
      expect(worldYToLat(latToWorldY(lat))).toBeCloseTo(lat, 9);
    }
  });
});

describe('strict inputs', () => {
  it('throws a TypeError for strings instead of returning a plausible wrong number', () => {
    expect(() => project('35.6586', '139.7454', view)).toThrow(TypeError);
    expect(() => project(35.6586, '139.7454', view)).toThrow('p5.geo.project(): lon must be a number, but got "139.7454".');
    expect(() => project(35, 139, { ...view, zoom: '12' })).toThrow('p5.geo.project(): view.zoom must be a number, but got "12".');
    expect(() => project(35, 139)).toThrow(/view must be/);
  });

  it('does not turn empty values into 0 (no Null Island)', () => {
    expect(() => project('', '', view)).toThrow(TypeError);
    expect(() => project(null, null, view)).toThrow('p5.geo.project(): lat must be a number, but got null.');
  });

  it('checks every function that takes coordinates', () => {
    expect(() => projectPath([{ lat: 35, lon: '139' }], view)).toThrow('p5.geo.projectPath(): points[0].lon must be a number, but got "139".');
    expect(() => projectPath('nope', view)).toThrow(/points must be an array/);
    expect(() => unproject('400', 300, view)).toThrow('p5.geo.unproject(): x must be a number, but got "400".');
    expect(() => latToWorldY('35')).toThrow(TypeError);
    expect(() => worldYToLat(undefined)).toThrow(TypeError);
  });

  it('lets NaN through, since it is a number', () => {
    expect(project(NaN, 139, view).y).toBeNaN();
  });
});
