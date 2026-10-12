// The version number is filled in from package.json at build time (scripts/build.mjs, and
// vitest.config.js for tests), so it can't go stale.

/**
 * The version of p5.geo, such as `"0.1.2"`, like `p5.VERSION` for p5.js. Handy for checking
 * which version a sketch actually loaded, for example when a CDN or browser cache serves an
 * older one.
 * @memberof geo
 * @static
 * @name VERSION
 * @constant {string}
 * @example
 * console.log(p5.geo.VERSION);
 */
/** @type {string} */
// eslint-disable-next-line no-undef
export const VERSION = typeof __P5GEO_VERSION__ === 'string' ? __P5GEO_VERSION__ : 'dev';
