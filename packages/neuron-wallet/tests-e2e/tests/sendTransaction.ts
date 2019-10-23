import Application from '../application'
import { createWallet } from '../operations'

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
export default (app: Application) => {
  beforeAll(async () => {
    // create a new wallet and navigate to the Send View
    const { client } = app.spectron
    await app.waitUntilLoaded()
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)
    await createWallet(app)
    await app.waitUntilLoaded()
    client.click('button[name=Send]')
    await app.waitUntilLoaded()
  })

  afterEach(async () => {
    const { client } = app.spectron
    client.click('button[type=reset]')
    await client.waitUntilWindowLoaded()
  })

  describe('Test address field boundary validation', () => {
    app.test('Invalid address should show alert', async () => {
      const { client } = app.spectron
      const invalidAddress = 'invalid-address'
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, invalidAddress)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe(`Address ${invalidAddress} is invalid`)
    })

    app.test('Empty address should show alert', async () => {
      const emptyAddress = ''
      const { client } = app.spectron
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, emptyAddress)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe('Address cannot be empty')
    })

    app.test('Valid address should not show alert', async () => {
      const validAddress = 'ckt1qyq0cwanfaf2t2cwmuxd8ujv2ww6kjv7n53sfwv2l0'
      const { client } = app.spectron
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      expect(errorMessage.state).toBe('failure')
    })
  })

  describe('Test amount field boundary validation', () => {
    const validAddress = 'ckt1qyq0cwanfaf2t2cwmuxd8ujv2ww6kjv7n53sfwv2l0'
    app.test('Amount 60.99999999 is too small, 61 CKB is required', async () => {
      const smallAmount = '60.99999999'
      const { client } = app.spectron
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      await app.waitUntilLoaded()
      client.elementIdValue(inputs.value[1].ELEMENT, smallAmount)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe(`The amount ${smallAmount} CKB is too small, please enter an amount no less than 61 CKB`)
    })

    app.test('Amount 0.123456789 is invalid, decimal places cannot be more than 8', async () => {
      const invalidAmount = '0.123456789'
      const { client } = app.spectron
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      client.elementIdValue(inputs.value[1].ELEMENT, invalidAmount)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe(`Amount ${invalidAmount} is invalid, please enter the Amount with no more than 8 decimal places`)
    })
  })

  describe('Amount is not enough', () => {
    const validAddress = 'ckt1qyq0cwanfaf2t2cwmuxd8ujv2ww6kjv7n53sfwv2l0'
    const validAmount = '61'
    app.test('Amount is not enough', async () => {
      const { client } = app.spectron
      const inputs = await app.elements('input')
      client.elementIdValue(inputs.value[0].ELEMENT, validAddress)
      client.elementIdValue(inputs.value[1].ELEMENT, validAmount)
      await app.waitUntilLoaded()
      const errorMessage = await app.element('.ms-TextField-errorMessage')
      const msg = await client.elementIdText(errorMessage.value.ELEMENT)
      expect(msg.value).toBe('Amount is not enough')
    })
  })

  describe('Test the transaction fee operations', () => {
    beforeAll(async () => {
      const { client } = app.spectron
      client.click('button[role=switch]')
      await app.waitUntilLoaded()
    })

    app.test('default price should be 1000 and default speed should be 500 blocks', async () => {
      const { client } = app.spectron
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      expect((await client.elementIdAttribute(priceField.value.ELEMENT, 'value')).value).toBe('1000')
      const speedDropdown = await client.$('div[role=listbox]')
      expect((await client.elementIdAttribute(speedDropdown.value.ELEMENT, 'innerText')).value).toBe('~ 500 blocks')
    })

    app.test('Change speed to ~ 100 blocks and the price should be 3000', async () => {
      const { client } = app.spectron
      client.click('div[role=listbox]')
      await app.waitUntilLoaded()
      client.click('button[title="~ 100 blocks"]')
      await app.waitUntilLoaded()
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      expect((await client.elementIdAttribute(priceField.value.ELEMENT, 'value')).value).toBe('3000')
    })

    app.test('Change the price to 100000 and the speed should switch to immediately', async () => {
      const { client } = app.spectron
      const transactionFeePanel = client.$('div[aria-label="transaction fee"]')
      const [, priceField] = await transactionFeePanel.$$('input')
      client.elementIdClear(priceField.value.ELEMENT)
      await app.waitUntilLoaded()
      client.elementIdValue(priceField.value.ELEMENT, '00')
      const speedDropdown = await client.$('div[role=listbox]')

      expect((await client.elementIdAttribute(speedDropdown.value.ELEMENT, 'innerText')).value).toBe('immediately')
    })
  })
}
