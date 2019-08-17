import Application from './application'
import tests from './tests'

describe('wallet tests', () => {
  let app = new Application()

  beforeAll(() => {
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  tests.Wallet(app)
  tests.Network(app)
})
