import { defineConfig } from 'vitepress';
import { examples } from './examples.js';

export default defineConfig({
  title: 'p5.geo',
  description: 'Geospatial visualization for p5.js: maps and geographic data with the drawing functions you already know.',
  // Served from https://enkatsu.github.io/p5.geo/
  base: '/p5.geo/',
  cleanUrls: true,
  // docs/templates/ holds the source of docs/api.md (npm run docs), not pages.
  srcExclude: ['templates/**'],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Reference', link: '/api' },
      { text: 'Changelog', link: 'https://github.com/enkatsu/p5.geo/blob/main/CHANGELOG.md' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Loading data', link: '/guide/data' },
            { text: 'Mouse and hit-testing', link: '/guide/interaction' },
            { text: 'Basemaps', link: '/guide/basemaps' },
            { text: 'Using with a bundler', link: '/guide/bundlers' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: Object.entries(examples).map(([name, { title }]) => ({ text: title, link: `/examples/${name}` })),
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/enkatsu/p5.geo' }],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License. Map data © OpenStreetMap contributors, basemaps by OpenFreeMap.',
    },
  },
});
