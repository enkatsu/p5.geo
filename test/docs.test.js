import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { renderApiDocs, outputPath } from '../scripts/docs.mjs';

describe('docs/api.md', () => {
  it('is up to date with the JSDoc comments (run `npm run docs` to update)', async () => {
    expect(await readFile(outputPath, 'utf8')).toBe(await renderApiDocs());
  }, 30000);
});
