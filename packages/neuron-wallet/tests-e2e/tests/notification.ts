import Application from '../application'

/**
 * 1. check the alert, it should be disconnected to the network
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
  beforeEach(async () => {
    await app.spectron.client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()

    app.spectron.client.click('button[name=Addresses]')
    await app.spectron.client.waitUntilWindowLoaded()
    await app.gotoSettingsView()

    app.spectron.client.click('button[name=Wallets]')
    await app.spectron.client.waitUntilWindowLoaded()
  })

  describe('Test alert message and notification', () => {
    const messages = {
      disconnected: 'Fail to connect to the node',
      incorrectPassword: 'Password is incorrect',
    }

    app.test('It should have an alert message of disconnection', async () => {
      const { client } = app.spectron
      const alertComponent = await client.$('.ms-MessageBar-text')
      const msg = await client.elementIdText(alertComponent.value.ELEMENT)
      expect(msg.value).toBe(messages.disconnected)
    })

    app.test('It should have an alert message of incorrect password', async () => {
      const { client } = app.spectron
      await app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await client.waitUntilWindowLoaded()
      const inputElement = await client.$('input')
      await client.elementIdValue(inputElement.value.ELEMENT, 'Invalid Password')
      client.click('button[type=submit]')
      await client.waitUntilWindowLoaded()
      await client.pause(3000)
      const alertComponent = await client.$('.ms-MessageBar-text')
      const msg = await client.elementIdText(alertComponent.value.ELEMENT)
      expect(msg.value).toBe(messages.incorrectPassword)
    })

    app.test('It should have two messages in the notification', async () => {
      const { client } = app.spectron
      const messageComponents = await client.$$('.ms-Panel-content p')
      expect(messageComponents.length).toBe(Object.keys(messages).length)
      const incorrectPasswordMsg = await client.element(`//P[text()="${messages.incorrectPassword}"]`)
      const disconnectMsg = await client.element(`//P[text()="${messages.disconnected}"]`)
      expect(incorrectPasswordMsg.state).not.toBe('failure')
      expect(disconnectMsg.state).not.toBe('failed')
    })

    app.test('Password-incorrect alerts should be dismissed once a correct one is inputted', async () => {
      const { client } = app.spectron
      await app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await client.waitUntilWindowLoaded()
      const inputElement = await client.$('input')
      await client.elementIdValue(inputElement.value.ELEMENT, 'Azusa2233')
      client.click('button[type=submit]')
      await client.waitUntilWindowLoaded()
      await client.pause(3000)
      const alertComponent = await client.$('.ms-MessageBar--error')
      const msg = await client.elementIdText(alertComponent.value.ELEMENT)
      expect(msg.value).toBe(messages.disconnected)
    })
  })
}
