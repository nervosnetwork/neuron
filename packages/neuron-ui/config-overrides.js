const path = require('path')

module.exports = function override(config) {
  // eslint-disable-next-line no-param-reassign
  config.resolve.alias.electron = path.join(__dirname, 'src/electron-alias')
  return {
    ...config,
  }
}
