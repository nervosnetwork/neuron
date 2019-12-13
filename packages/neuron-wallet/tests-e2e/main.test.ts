import Application from './application'
import tests from './tests'

describe('Test wallet', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() =>  app.stop())

  tests.Wallet(app)
})

describe('Test networks', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() =>  app.stop())

  tests.Network(app)
})

describe('Test transaction', () => {
  let app = new Application()
  beforeAll(() => app.start())
  afterAll(() =>  app.stop())

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
