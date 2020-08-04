const path = require('path')

module.exports = function override(config) {
  const webpackCofnig = { ...config }
  webpackCofnig.resolve.alias.electron = path.join(__dirname, 'src/electron-alias')
  return webpackCofnig
}
