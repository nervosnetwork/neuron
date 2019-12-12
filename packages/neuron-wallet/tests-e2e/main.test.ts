import Application from './application'
import tests from './tests'

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
})

describe('Test transaction in neuron', () => {
  let app = new Application()

  beforeAll(() => {
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  // tests.SendTransaction(app) // It fails too often, skip temporarily until we make tests more robust.
})

describe.skip('Test notification', () => {
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
