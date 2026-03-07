module.exports = {
  namespaceSeparator: false,
  // Namespace separator used in your translation keys
  // If you want to use plain english keys, set it to false;
  // if you use nested objects (e.g. common.app_name), set it to '.'

  createOldCatalogs: false,
  // Save the old catalogs in a subdirectory

  defaultNamespace: 'translation',
  // Default namespace used in your i18next config

  defaultValue: '',
  // Default value used for new keys

  indentation: 2,
  // Indentation of the output file

  keepRemoved: true,
  // Keep keys from the catalog that are no longer in code

  keySeparator: '.',
  // Key separator used in your translation keys
  // If you want to use plain english keys, set it to false;
  // if you use nested objects (e.g. common.app_name), set it to '.'

  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
    js: ['JavascriptLexer'],
    jsx: ['JavascriptLexer'],
    default: ['JavascriptLexer'],
  },

  lineEnding: 'auto',
  // Control the line ending. See options at https://github.com/i18next/i18next-parser#options

  locales: ['en', 'ru'],
  // An array of the locales in your applications

  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  // Supports $LOCALE and $NAMESPACE injection
  // Supports JSON (.json) and YAML (.yml) file formats
  // Where to write the locale files relative to process.cwd()

  input: ['src/**/*.{js,jsx,ts,tsx}'],
  // An array of globs that describe where to look for source files
  // relative to the configuration file

  sort: true,
  // Whether or not to sort the catalog

  useKeysAsDefaultValue: false,
  // Whether to use the keys as the default value; useful if you don't use ids

  verbose: true,
  // Display info about the process
};
