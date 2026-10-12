// The examples shown on the site. Each one lives in examples/<name>/ and runs on the site
// from /sketches/<name>/ (copied there by scripts/site.mjs).
// webEditor: the sketch's URL in the p5.js Web Editor (paste dist/web-editor/<name>/ into a
// new sketch, save it, and put its link here). Leave it empty to hide the link.
export const examples = {
  basic: {
    title: 'Basic',
    description: 'Points written in the sketch, on a map. No data files.',
    webEditor: '',
  },
  'geojson-world': {
    title: 'GeoJSON: world',
    description: 'Country polygons loaded from the web, drawn without a basemap. Hover a country.',
    webEditor: '',
  },
  'csv-earthquakes': {
    title: 'CSV: earthquakes',
    description: 'A live CSV from the USGS, sized and colored by its columns.',
    webEditor: '',
  },
};
