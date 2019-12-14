import Application from './application'

/**
 * 1. navigate to the send transaction view
 * 2. test the address input
 *   2.1 empty address
 *   2.2 invalid address
 * 3. test amount
 *   3.1 amount should be at least 61CKB
 *   3.2 the decimal places should be no more than 8
 * 4. amount not enough
 */
describe('Send transaction tests', () => {
  const app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  beforeEach(async () => {
    await app.spectron.client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()
    app.spectron.client.click('button[name=Nervos Dao]')
    await app.spectron.client.waitUntilWindowLoaded()
    app.spectron.client.click('button[name=Send]')
    await app.spectron.client.waitUntilWindowLoaded()
  })

  afterEach(async () => {
    const { client } = app.spectron
    client.click('button[type=reset]')
    await client.waitUntilWindowLoaded()
  })

  describe('Test address field boundary validation', () => {
    app.test('Invalid address should show alert', async () => {
      const { client } = app.spectron
      const invalidAddress = 'invalid'
      const inputs = await client.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, invalidAddress)
      const errorMessage = await client.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.state).not.toBe('failure')
    })

    app.test('Empty address should show alert', async () => {
      const emptyAddress = ''
      const { client } = app.spectron
      const inputs = await client.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, emptyAddress)
      await client.waitUntilWindowLoaded()
      const errorMessage = await client.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe('Address cannot be empty')
    })

    app.test('Valid address should not show alert', async () => {
      const validAddress = 'ckt1qyq0cwanfaf2t2cwmuxd8ujv2ww6kjv7n53sfwv2l0'
      const { client } = app.spectron
      const inputs = await client.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      const errorMessage = await client.element('.ms-TextField-errorMessage')
      expect(errorMessage.state).toBe('failure')
    })
  })

  describe('Test amount field boundary validation', () => {
    const validAddress = 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd'
    const invalidAmount = '0.123456789'
    app.test('Amount 0.123456789 is invalid, decimal places cannot be more than 8', async () => {
      const { client } = app.spectron
      const inputs = await client.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      client.elementIdValue(inputs.value[1].ELEMENT, invalidAmount)
      await client.waitUntilWindowLoaded()
      const errorMessage = await client.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe(`Amount ${invalidAmount} is invalid, please enter the Amount with no more than 8 decimal places`)
    })
  })

  describe('Amount is not enough', () => {
    const validAddress = 'ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd'
    const invalidAmount = '61'
    app.test('Amount is not enough', async () => {
      const { client } = app.spectron
      const inputs = await client.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      client.elementIdValue(inputs.value[1].ELEMENT, invalidAmount)
      await client.waitUntilWindowLoaded()
      const errorMessage = await client.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe('Amount is not enough')
    })
  })

  describe('Test the transaction fee operations', () => {
    beforeEach(async () => {
      const { client } = app.spectron
      client.click('button[role=switch]')
      await client.waitUntilWindowLoaded()
    })

    app.test('default price should be 1,000 and default speed should be 500 blocks', async () => {
      const { client } = app.spectron
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      expect((await client.elementIdAttribute(priceField.value.ELEMENT, 'value')).value).toBe('1,000')
      const speedDropdown = await client.$('div[role=listbox]')
      expect((await client.elementIdAttribute(speedDropdown.value.ELEMENT, 'innerText')).value).toBe('~ 500 blocks')
    })

    app.test('Change speed to ~ 100 blocks and the price should be 3,000', async () => {
      const { client } = app.spectron
      client.click('div[role=listbox]')
      await client.waitUntilWindowLoaded()
      client.click('button[title="~ 100 blocks"]')
      await client.waitUntilWindowLoaded()
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      expect((await client.elementIdAttribute(priceField.value.ELEMENT, 'value')).value).toBe('3,000')
    })

    app.test('Change the price to 100,000 and the speed should switch to immediately', async () => {
      const { client } = app.spectron
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      client.elementIdClear(priceField.value.ELEMENT)
      await client.waitUntilWindowLoaded()
      client.elementIdValue(priceField.value.ELEMENT, '00')
      const speedDropdown = await client.$('div[role=listbox]')

      expect((await client.elementIdAttribute(speedDropdown.value.ELEMENT, 'innerText')).value).toBe('immediately')
    })
  })
})
