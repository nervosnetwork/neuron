import Application from './application'
import tests from './tests'
import env from './env'

describe('Test data storage in neuron', () => {
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

describe('Test transaction in neuron', () => {
  let app = new Application()

  beforeAll(() => {
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  tests.SendTransaction(app)
})

describe('Test notification', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() => app.stop())
  tests.Notification(app)
})

describe('Test address book', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() => app.stop())
  tests.AddressBook(app)
})

describe('Test general settings', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() => app.stop())
  tests.GeneralSettings(app)
})
