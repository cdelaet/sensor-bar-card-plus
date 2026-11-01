const testLocale = 'nl-BE';

module.exports = {
  testLocale,
  nodeLocale: `${testLocale.replace('-', '_')}.UTF-8`,
};
