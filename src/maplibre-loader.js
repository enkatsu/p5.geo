// Loads MapLibre GL JS on demand, so a sketch only needs the p5.geo <script> tag.

export const MAPLIBRE_VERSION = '6.13.0';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist`;

let loading = null;

function ensureCss() {
  if (document.querySelector('link[href*="maplibre-gl"][href$=".css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${CDN_BASE}/maplibre-gl.css`;
  document.head.appendChild(link);
}

// Resolves to the maplibregl namespace. Uses, in order: the one passed in (whoever passes
// it, typically from npm with a bundler, also imports its CSS), a global `maplibregl`
// (e.g. MapLibre 5.x loaded with its own <script> tag), or the ES module from the CDN.
export function loadMapLibre(provided) {
  if (provided) return Promise.resolve(provided);
  ensureCss();
  if (globalThis.maplibregl) return Promise.resolve(globalThis.maplibregl);
  if (!loading) {
    const url = `${CDN_BASE}/maplibre-gl.mjs`;
    // The comments stop bundlers (webpack, Vite) from trying to resolve the URL themselves.
    loading = import(/* webpackIgnore: true */ /* @vite-ignore */ url).catch((err) => {
      loading = null;
      throw new Error(`p5.geo: could not load MapLibre GL JS from ${url} (${err.message})`);
    });
  }
  return loading;
}
