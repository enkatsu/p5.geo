// Generates docs/api.md from docs/templates/api.hbs and the JSDoc comments in src/.
// `npm run docs` writes the file; test/docs.test.js fails if it's out of date.
import jsdoc2md from 'jsdoc-to-markdown';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
export const outputPath = fileURLToPath(new URL('docs/api.md', root));

export async function renderApiDocs() {
  const template = await readFile(new URL('docs/templates/api.hbs', root), 'utf8');
  const markdown = await jsdoc2md.render({
    files: fileURLToPath(new URL('src/*.js', root)),
    template,
    'heading-depth': 2,
  });
  return (
    markdown
      // Headings use the names a sketch would write: myMap.toScreen(), p5.geo.project().
      .replace(/^(#+ )geoMap\./gm, '$1myMap.')
      .replace(/^(#+ )geo\./gm, '$1p5.geo.')
      .replace(/^(#+ )geo : <code>object<\/code>/gm, '$1p5.geo')
      // No links inside headings: the site's search takes a heading's first link as its anchor,
      // so linked return types (such as GeoMap) would give several headings the same one.
      .replace(/^#+ .*$/gm, (heading) => heading.replace(/\[([^\]]*)\]\(#[^)]*\)/g, '$1'))
      .replace(/\n{3,}/g, '\n\n')
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(outputPath, await renderApiDocs());
  console.log(`Wrote ${outputPath}`);
}
