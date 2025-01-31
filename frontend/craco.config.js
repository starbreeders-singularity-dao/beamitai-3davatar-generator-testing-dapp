// craco.config.js

module.exports = {
    webpack: {
      configure: (webpackConfig, { env, paths }) => {
        if (env === 'development') {
          webpackConfig.devtool = 'source-map';
        }
        return webpackConfig;
      },
    },
  };
  