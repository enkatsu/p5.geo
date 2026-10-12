---
layout: home

hero:
  name: p5.geo
  text: Maps for p5.js
  tagline: Draw geographic data with the p5.js functions you already know. No API keys, no build step.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Examples
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/enkatsu/p5.geo

features:
  - title: Sketch-first
    details: The map is just a background. Everything you draw is plain p5.js, with circle(), beginShape() and friends.
  - title: No API keys
    details: Works out of the box with keyless basemaps from OpenFreeMap. Nothing to sign up for.
  - title: One script tag
    details: Add one line to index.html and it runs in the p5.js Web Editor. An npm package is there too, for bundlers.
  - title: Maps optional
    details: Turn the basemap off and draw maps entirely with p5 shapes, from CSV and GeoJSON data.
---

<Example name="geojson-world" :height="420" />
