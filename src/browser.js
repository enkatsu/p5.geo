// Entry point for <script> tags (dist/p5.geo.js): registers with the global p5.
import p5geo from './addon.js';

const p5 = globalThis.p5;
if (!p5) {
  throw new Error('p5.geo: load p5.js before p5.geo.');
}
if (typeof p5.registerAddon === 'function') {
  // p5.js 2.x
  p5.registerAddon(p5geo);
} else {
  // p5.js 1.x
  const lifecycles = {};
  p5geo(p5, p5.prototype, lifecycles);
  p5.prototype.registerMethod('pre', lifecycles.predraw);
  p5.prototype.registerMethod('remove', lifecycles.remove);
}
