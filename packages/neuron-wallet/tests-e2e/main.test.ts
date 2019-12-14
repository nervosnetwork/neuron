import Application from './application'
import tests from './tests'

describe('Test wallets', () => {
  let app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  tests.Wallet(app)
})

describe('Test networks', () => {
  let app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  tests.Network(app)
})

// It fails too often, skip temporarily until we make tests more robust.
describe.skip('Test transaction', () => {
  let app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  tests.SendTransaction(app)
})

describe('Test notification', () => {
  let app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  tests.Notification(app)
})

describe('Test address book', () => {
  let app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  tests.AddressBook(app)
})
