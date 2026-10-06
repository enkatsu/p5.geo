import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const banner = { js: `/*! p5.geo v${pkg.version} | MIT License */` };

const common = {
  bundle: true,
  target: 'es2020',
  banner,
  logLevel: 'info',
};

const builds = [
  // <script> tags: registers with the global p5.
  { ...common, entryPoints: ['src/browser.js'], format: 'iife', outfile: 'dist/p5.geo.js' },
  { ...common, entryPoints: ['src/browser.js'], format: 'iife', outfile: 'dist/p5.geo.min.js', minify: true, sourcemap: true },
  // Bundlers: an ES module exporting the addon; the sketch registers it.
  { ...common, entryPoints: ['src/index.js'], format: 'esm', outfile: 'dist/p5.geo.esm.js' },
];

if (process.argv.includes('--serve')) {
  // Rebuild on change and serve the repo root, so examples/ can load ../../dist/p5.geo.js.
  const contexts = await Promise.all(builds.map((b) => esbuild.context(b)));
  await Promise.all(contexts.map((c) => c.watch()));
  // --lan also accepts requests from other devices on the network (to try sketches on a
  // phone). esbuild otherwise only answers requests addressed to localhost.
  const lan = process.argv.includes('--lan');
  const { port } = await contexts[0].serve({ servedir: '.', port: 8000, ...(lan && { host: '0.0.0.0' }) });
  console.log(`Serving at http://localhost:${port}/examples/`);
  if (lan) {
    const { networkInterfaces } = await import('node:os');
    for (const addr of Object.values(networkInterfaces()).flat()) {
      if (addr.family === 'IPv4' && !addr.internal) console.log(`On the network: http://${addr.address}:${port}/examples/`);
    }
  }
} else {
  await Promise.all(builds.map((b) => esbuild.build(b)));
}
