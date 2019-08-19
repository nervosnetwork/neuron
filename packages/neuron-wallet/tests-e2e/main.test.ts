import Application from './application'
import tests from './tests'
import env from './env'

describe('neuron wallet tests', () => {
  let app = new Application()

  beforeAll(() => {
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  tests.Wallet(app)
  tests.Network(app)
  tests.Transaction(app, env.transaction)
})
