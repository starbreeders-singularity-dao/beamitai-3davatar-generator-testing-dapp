// config-overrides.js

const { override } = require('customize-cra');

module.exports = override((config, env) => {
  if (env === 'development') {
    config.devtool = 'cheap-module-source-map'; // You can also try 'source-map' or 'inline-source-map'
  }
  return config;
});
