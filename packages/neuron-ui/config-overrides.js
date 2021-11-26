const path = require('path')

module.exports = function override(config) {
  const webpackConfig = { ...config }
  webpackConfig.resolve.alias.electron = path.join(__dirname, 'src/electron-modules')
  return webpackConfig
}
