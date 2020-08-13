const { expose } = require('../../../dist/utils/worker')

expose({
  f1() {

  },
  f2() {
    return 'f2'
  },
  async f3() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('f3')
      }, 2000)
    }, )
  },
  f4(...args) {
    return args
  },
  f5() {
    process.send({ f5: 'f5' })
    return 'f5'
  }
})
