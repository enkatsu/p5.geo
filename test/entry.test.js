import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  delete globalThis.p5;
  vi.resetModules();
});

describe('src/browser.js (<script> tags)', () => {
  it('registers with p5.js 2.x through registerAddon', async () => {
    const registerAddon = vi.fn();
    globalThis.p5 = { registerAddon };
    await import('../src/browser.js');
    expect(registerAddon).toHaveBeenCalledTimes(1);

    // The addon adds the sketch functions and the lifecycle hooks p5 2.x expects.
    const fn = {};
    const lifecycles = {};
    const p5 = {};
    registerAddon.mock.calls[0][0](p5, fn, lifecycles);
    expect(typeof fn.createGeoMap).toBe('function');
    expect(typeof fn.geoPoints).toBe('function');
    expect(typeof lifecycles.predraw).toBe('function');
    expect(typeof lifecycles.remove).toBe('function');
    expect(typeof p5.geo.project).toBe('function');
  });

  it('falls back to registerMethod for p5.js 1.x', async () => {
    const registerMethod = vi.fn();
    globalThis.p5 = { prototype: { registerMethod } };
    await import('../src/browser.js');
    expect(typeof globalThis.p5.prototype.createGeoMap).toBe('function');
    expect(registerMethod.mock.calls.map(([name]) => name)).toEqual(['pre', 'remove']);
  });

  it('explains that p5.js has to come first', async () => {
    await expect(import('../src/browser.js')).rejects.toThrow('p5.geo: load p5.js before p5.geo.');
  });
});

describe('src/index.js (bundlers)', () => {
  it('exports the addon without registering it, and the helpers by name', async () => {
    const mod = await import('../src/index.js');
    expect(globalThis.p5).toBeUndefined();
    expect(typeof mod.default).toBe('function');
    expect(mod.default.length).toBe(3); // (p5, fn, lifecycles), as p5.registerAddon() expects
    for (const name of ['GeoMap', 'geoPoints', 'geoLines', 'geoPolygons', 'geoBounds', 'project', 'unproject', 'fitView', 'STYLES']) {
      expect(mod[name], name).toBeDefined();
    }
  });
});
