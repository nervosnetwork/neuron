const { expose } = require('./../../../dist/utils/worker')

expose({
  doNothing() {

  },
  normal() {
    return 'normal'
  },
  async async() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('async/await')
      }, 2000)
    }, )
  },
  args(...args) {
    return args
  }
})
