import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // Same as scripts/build.mjs, so src/version.js reports the package version in tests too.
  define: { __P5GEO_VERSION__: JSON.stringify(version) },
});
