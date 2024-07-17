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
  return webpackConfig
}
