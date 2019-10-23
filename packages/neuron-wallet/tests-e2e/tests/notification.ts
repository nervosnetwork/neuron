import Application from '../application'
import { createWallet } from '../operations'

/**
 * 1. check the alert, it should be empty
 * 2. navigate to wallet settingsState
 * 3. delete a wallet
 * 4. input a wrong password
 * 5. check the alert, it should be incorrect password
 * 6. check the notification, it should have two messages
 *   1. incorrect PasswordRequest
 *   2. disconnected to the network
 * 7. password-incorrect alerts should be dismissed once a correct one is inputted
 */
export default (app: Application) => {
  beforeAll(async () => {
    // create a new wallet and navigate to the wallet settings
    const { client } = app.spectron
    await app.waitUntilLoaded()
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)
    await createWallet(app)
    await app.waitUntilLoaded()
    // Go to setting page
    await app.gotoSettingPageFromMenu()
    await app.waitUntilLoaded()

    client.click('button[name=Wallets]')
    await app.waitUntilLoaded()
  })

  describe('Test alert message and notification', () => {
    const messages = {
      incorrectPassword: 'Password is incorrect',
    }

    app.test('There is no alerts after the app launched', async () => {
      const { client } = app.spectron
      const alertComponent = await client.$('.ms-MessageBar-text')
      const msg = await client.elementIdText(alertComponent.value.ELEMENT)
      expect(msg.value).toBe('')
    })

    app.test('It should have an alert message of incorrect password', async () => {
      const { client } = app.spectron
      await app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await app.waitUntilLoaded()
      const inputElement = await client.$('input')
      await client.elementIdValue(inputElement.value.ELEMENT, 'Invalid Password')
      client.click('button[type=submit]')
      await app.waitUntilLoaded()
      app.wait(4000)
      const alertComponent = await client.$('.ms-MessageBar-text')
      const msg = await client.elementIdText(alertComponent.value.ELEMENT)
      expect(msg.value).toBe(messages.incorrectPassword)
    })

    app.test('It should have a message in the notification', async () => {
      const { client } = app.spectron
      const messageComponents = await client.$$('.ms-Panel-content p')
      expect(messageComponents.length).toBe(Object.keys(messages).length)
      const incorrectPasswordMsg = await client.element(`//P[text()="${messages.incorrectPassword}"]`)
      expect(incorrectPasswordMsg.state).not.toBe('failure')
    })

    // TODO: dismiss a message

    app.test('Password-incorrect alerts should be dismissed once a correct one is inputted', async () => {
      const { client } = app.spectron
      await app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await app.waitUntilLoaded()
      const inputElement = await client.$('input')
      await client.elementIdValue(inputElement.value.ELEMENT, 'Azusa2233')
      client.click('button[type=submit]')
      await app.waitUntilLoaded()
      app.wait(4000)
      const alertComponent = await client.$('.ms-MessageBar--error')
      expect(alertComponent.state).toBe('failure')
    })
  })
}
