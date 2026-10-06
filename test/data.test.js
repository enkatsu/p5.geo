import { describe, it, expect, vi } from 'vitest';
import { geoPoints, geoLines, geoPolygons, geoBounds } from '../src/data.js';
import { fitView, project } from '../src/projection.js';

// The shape of a p5.Table loaded with 'header'.
function fakeTable(columns, rows) {
  return { columns, rows: rows.map((arr) => ({ arr, getString: (c) => arr[columns.indexOf(c)] })) };
}

const fc = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'a' }, geometry: { type: 'Point', coordinates: [139.7, 35.6] } },
    { type: 'Feature', properties: { name: 'b' }, geometry: { type: 'MultiPoint', coordinates: [[1, 2], [3, 4]] } },
    { type: 'Feature', properties: { name: 'l' }, geometry: { type: 'LineString', coordinates: [[0, 0], [10, 5]] } },
    {
      type: 'Feature',
      properties: { name: 'ml' },
      geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'p' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          [[2, 2], [3, 2], [3, 3], [2, 2]],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'mp' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[20, 20], [21, 20], [21, 21], [20, 20]]], [[[30, -30], [31, -30], [31, -29], [30, -30]]]],
      },
    },
  ],
};

describe('geoPoints from tables', () => {
  it('finds lat/lon columns and converts numbers', () => {
    const t = fakeTable(['name', 'Latitude', 'Longitude', 'mag', 'code'], [
      ['Tokyo Tower', '35.6586', '139.7454', '5.2', '007'],
    ]);
    const [p] = geoPoints(t);
    expect(p.lat).toBe(35.6586);
    expect(p.lon).toBe(139.7454);
    expect(p.properties).toEqual({ name: 'Tokyo Tower', Latitude: 35.6586, Longitude: 139.7454, mag: 5.2, code: '007' });
  });

  it('recognizes lng and Japanese column names', () => {
    expect(geoPoints(fakeTable(['lat', 'lng'], [['1', '2']]))[0]).toMatchObject({ lat: 1, lon: 2 });
    expect(geoPoints(fakeTable(['緯度', '経度'], [['35', '139']]))[0]).toMatchObject({ lat: 35, lon: 139 });
  });

  it('uses named columns when given', () => {
    const t = fakeTable(['y', 'x'], [['35', '139']]);
    expect(geoPoints(t, { lat: 'y', lon: 'x' })[0]).toMatchObject({ lat: 35, lon: 139 });
  });

  it('explains what went wrong when columns are missing', () => {
    const t = fakeTable(['y', 'x'], [['35', '139']]);
    expect(() => geoPoints(t)).toThrow(/latitude column.*Columns are: y, x/);
    expect(() => geoPoints(t, { lat: 'nope' })).toThrow(/no column named "nope"/);
  });

  it('explains how to load a header row when columns have no names', () => {
    const t = fakeTable([null, null], [['35', '139']]);
    expect(() => geoPoints(t)).toThrow(/no column names.*'header'/);
  });

  it('skips rows without valid coordinates, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = fakeTable(['lat', 'lon'], [['1', '2'], ['', '3'], ['x', '4'], ['5', '6']]);
    expect(geoPoints(t).map((p) => p.lat)).toEqual([1, 5]);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/skipped 2 row/));
    warn.mockRestore();
  });

  it('accepts an array of plain objects', () => {
    expect(geoPoints([{ lat: 1, lon: 2, n: 'a' }])[0]).toEqual({ lat: 1, lon: 2, properties: { lat: 1, lon: 2, n: 'a' } });
  });

  it('says when data is not loaded yet', () => {
    expect(() => geoPoints(undefined)).toThrow(/loaded yet/);
  });
});

describe('GeoJSON', () => {
  it('extracts points, splitting MultiPoint', () => {
    const points = geoPoints(fc);
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ lat: 35.6, lon: 139.7, properties: { name: 'a' } });
    expect(points[2]).toMatchObject({ lat: 4, lon: 3, properties: { name: 'b' } });
  });

  it('extracts lines, splitting MultiLineString', () => {
    const lines = geoLines(fc);
    expect(lines).toHaveLength(3);
    expect(lines[0].path).toEqual([{ lat: 0, lon: 0 }, { lat: 5, lon: 10 }]);
    expect(lines[2].properties.name).toBe('ml');
  });

  it('extracts polygons with holes, splitting MultiPolygon', () => {
    const polygons = geoPolygons(fc);
    expect(polygons).toHaveLength(3);
    expect(polygons[0].outer).toHaveLength(5);
    expect(polygons[0].holes).toHaveLength(1);
    expect(polygons[0].holes[0][1]).toEqual({ lat: 2, lon: 3 });
    expect(polygons[2].properties.name).toBe('mp');
  });

  it('accepts a single Feature or bare geometry', () => {
    expect(geoPoints(fc.features[0])).toHaveLength(1);
    expect(geoLines(fc.features[2].geometry)).toHaveLength(1);
  });
});

describe('geoBounds and fitView', () => {
  it('measures raw GeoJSON and extracted lists alike', () => {
    const expected = { north: 21, south: -30, east: 31, west: 0 };
    expect(geoBounds(geoPolygons(fc))).toEqual(expected);
    expect(geoBounds({ type: 'FeatureCollection', features: fc.features.slice(2) })).toEqual(expected);
    expect(geoBounds([])).toBeNull();
  });

  it('fits the bounds inside the screen with padding', () => {
    const bounds = { north: 36, south: 35, east: 140, west: 139 };
    const view = { ...fitView(bounds, 800, 600, { padding: 50 }), width: 800, height: 600 };
    const nw = project(bounds.north, bounds.west, view);
    const se = project(bounds.south, bounds.east, view);
    // The tighter axis touches the padding exactly; the other stays inside.
    const fitsX = Math.abs(nw.x - 50) < 1e-6 && Math.abs(se.x - 750) < 1e-6;
    const fitsY = Math.abs(nw.y - 50) < 1e-6 && Math.abs(se.y - 550) < 1e-6;
    expect(fitsX || fitsY).toBe(true);
    expect(nw.x).toBeGreaterThanOrEqual(50 - 1e-6);
    expect(nw.y).toBeGreaterThanOrEqual(50 - 1e-6);
    expect(se.x).toBeLessThanOrEqual(750 + 1e-6);
    expect(se.y).toBeLessThanOrEqual(550 + 1e-6);
  });

  it('rejects bounds that are not numbers', () => {
    expect(() => fitView({ north: '36', south: 35, east: 140, west: 139 }, 800, 600)).toThrow(
      'p5.geo.fitView(): bounds.north must be a number, but got "36".'
    );
    expect(() => fitView(null, 800, 600)).toThrow(TypeError);
  });

  it('caps the zoom for a single point', () => {
    expect(fitView({ north: 35, south: 35, east: 139, west: 139 }, 800, 600).zoom).toBe(16);
  });
});
