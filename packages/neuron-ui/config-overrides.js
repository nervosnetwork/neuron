/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = function override(config) {
  const webpackConfig = { ...config }
  webpackConfig.resolve.alias.electron = path.join(__dirname, 'src/electron-modules')
  webpackConfig.resolve.fallback = {
    fs: false,
    crypto: false,
    buffer: false,
  }
  /* disable autoprefixer */
  webpackConfig.module.rules
    .find(r => r.oneOf)
    .oneOf.forEach(rule => {
      if (rule.use) {
        rule.use.forEach(loader => {
          if (loader.options && loader.options.postcssOptions) {
            loader.options.postcssOptions.plugins = loader.options.postcssOptions.plugins.filter(
              plugin => !plugin.toString().includes('autoprefixer')
            )
          }
        })
      }
    })
  return webpackConfig
}
