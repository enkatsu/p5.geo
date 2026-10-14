// The examples shown on the site. Each one lives in examples/<name>/ and runs on the site
// from /sketches/<name>/ (copied there by scripts/site.mjs).
// webEditor: the sketch's URL in the p5.js Web Editor (paste dist/web-editor/<name>/ into a
// new sketch, save it, and put its link here). Leave it empty to hide the link.
export const examples = {
  basic: {
    title: 'Basic',
    description: 'Points written in the sketch, on a map. No data files.',
    webEditor: 'https://editor.p5js.org/KatsuyaEndoh/sketches/BenYzEz9U',
  },
  'geojson-world': {
    title: 'GeoJSON: world',
    description: 'Country polygons loaded from the web, drawn without a basemap. Hover a country.',
    webEditor: 'https://editor.p5js.org/KatsuyaEndoh/sketches/E32RnOcIV',
  },
  'csv-earthquakes': {
    title: 'CSV: earthquakes',
    description: 'A live CSV from the USGS, sized and colored by its columns.',
    webEditor: 'https://editor.p5js.org/KatsuyaEndoh/sketches/pRbJr6hLx',
  },
  'geojson-rivers': {
    title: 'GeoJSON: rivers',
    description: "The world's major rivers as GeoJSON lines, drawn without a basemap. Hover a river.",
    webEditor: 'https://editor.p5js.org/KatsuyaEndoh/sketches/ea1QfG2jc',
  },
  'animation-trip': {
    title: 'Animation: trip',
    description: 'A point travels from city to city, and the map follows it.',
    webEditor: 'https://editor.p5js.org/KatsuyaEndoh/sketches/sFTJfN-a_',
  },
};
