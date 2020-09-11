const path = require('path')

module.exports = {
  webpackFinal: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      electron: path.join(__dirname, '..', 'src', 'electron-modules'),
    }
    return config
  },
}
