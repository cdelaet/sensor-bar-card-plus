const { nodeLocale } = require('./tests/support/test-locale.cjs');

process.env.LANG = nodeLocale;
process.env.LC_ALL = nodeLocale;

module.exports = {
  test: {
    include: ['tests/unit/**/*.spec.mjs'],
    environment: 'node',
    reporters: 'default',
  },
};
