// Keyless basemap styles. Each one shows its own attribution through MapLibre.

/**
 * The basemap presets for the `basemap` option of {@link createGeoMap}: keyless
 * [OpenFreeMap](https://openfreemap.org/) styles, by name.
 * @memberof geo
 * @static
 * @name STYLES
 * @constant {Object<string, string>}
 */
export const STYLES = {
  positron: 'https://tiles.openfreemap.org/styles/positron',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
};

export const DEFAULT_STYLE = 'positron';

// Accepts a preset name, a style URL, or a MapLibre style object.
export function resolveStyle(style) {
  if (style == null || style === true) style = DEFAULT_STYLE;
  if (typeof style === 'string' && Object.hasOwn(STYLES, style)) return STYLES[style];
  return style;
}
