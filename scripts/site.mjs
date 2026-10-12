// Prepares the documentation site (docs/, built with VitePress):
// - builds the library, then copies each examples/<name>/ to docs/public/sketches/<name>/ and
//   the built dist/ files to docs/public/dist/, so the site runs the examples against the same
//   code the docs describe (sketches/, not examples/, which holds the pages about them);
// - writes Web Editor versions of the examples to dist/web-editor/, loading p5.geo from the
//   CDN instead of ../../dist/, ready to paste into the p5.js Web Editor.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const pkg = JSON.parse(await readFile(path('package.json'), 'utf8'));

execFileSync('npm', ['run', 'build'], { cwd: path('.'), stdio: 'inherit' });

// The site: examples/<name>/ load ../../dist/p5.geo.js, so keep that depth under public/.
const sketchDirs = (await readdir(path('examples'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
await rm(path('docs/public/sketches'), { recursive: true, force: true });
await rm(path('docs/public/dist'), { recursive: true, force: true });
for (const name of sketchDirs) {
  await cp(path(`examples/${name}`), path(`docs/public/sketches/${name}`), { recursive: true });
}
await mkdir(path('docs/public/dist'), { recursive: true });
for (const file of ['p5.geo.js', 'p5.geo.min.js', 'p5.geo.min.js.map']) {
  await cp(path(`dist/${file}`), path(`docs/public/dist/${file}`));
}

// The Web Editor: the published release from the CDN, on the current minor version.
const [major, minor] = pkg.version.split('.');
const cdn = `https://cdn.jsdelivr.net/npm/p5.geo@${major}.${minor}/dist/p5.geo.min.js`;
await rm(path('dist/web-editor'), { recursive: true, force: true });
for (const name of sketchDirs) {
  const out = path(`dist/web-editor/${name}`);
  await mkdir(out, { recursive: true });
  const html = await readFile(path(`examples/${name}/index.html`), 'utf8');
  if (!html.includes('../../dist/p5.geo.js')) throw new Error(`examples/${name}/index.html doesn't load ../../dist/p5.geo.js`);
  await writeFile(`${out}/index.html`, html.replace('../../dist/p5.geo.js', cdn));
  await cp(path(`examples/${name}/sketch.js`), `${out}/sketch.js`);
}
console.log(`Copied examples to docs/public/sketches/ and wrote Web Editor versions to dist/web-editor/ (${cdn})`);
