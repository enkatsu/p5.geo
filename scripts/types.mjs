// Generates TypeScript declarations into dist/types/ from the JSDoc comments in src/,
// then tidies them up. The parts that add functions to p5 can't be expressed in JSDoc,
// so they are written by hand in types/index.d.ts and types/global.d.ts.
import { execFileSync } from 'node:child_process';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const outDir = new URL('dist/types/', root);

await rm(outDir, { recursive: true, force: true });
execFileSync('npx', ['tsc', '-p', 'tsconfig.types.json'], { cwd: fileURLToPath(root), stdio: 'inherit' });

for (const file of await readdir(outDir)) {
  const url = new URL(file, outDir);
  let dts = await readFile(url, 'utf8');
  // Internal members (named with a leading underscore) aren't part of the API.
  dts = dts.replace(/^\s+(private )?_\w+;\n/gm, '');
  // JSDoc refers to p5's types and to LatLon (defined in geomap.js) without importing them.
  const imports = [];
  if (/\bp5\./.test(dts)) imports.push("import type p5 from 'p5';");
  if (/\bLatLon\b/.test(dts) && !/type LatLon =/.test(dts)) imports.push("import type { LatLon } from './geomap.js';");
  if (imports.length) dts = `${imports.join('\n')}\n${dts}`;
  await writeFile(url, dts);
}
console.log(`Wrote ${fileURLToPath(outDir)}`);
