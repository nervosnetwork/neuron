import Application from '../application'
import { importWallet } from '../operations'

export default (app: Application) => {
  app.test('create wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()
  })

  app.test('import wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()

    await app.gotoSettingsView()
    await client.waitUntilWindowLoaded()

    // Switch to wallet setting
    client.click('button[name=Wallets]')
    await client.waitUntilWindowLoaded()

    // Go to import wallet page
    client.click('button[name=import-wallet-seed]')
    await client.waitUntilWindowLoaded()

    await importWallet(app, 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog')
    await client.waitUntilWindowLoaded()
  })

  test.skip('switch to first wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()
    await app.createWalletFromSettings()

    await app.gotoSettingsView()
    await client.waitUntilWindowLoaded()

    // Switch to wallet setting
    client.click('button[name=Wallets]')
    await client.waitUntilWindowLoaded()

    // Switch to first wallet
    const firstWallet = await client.element('label.ms-ChoiceField-field span')
    await client.waitUntilWindowLoaded()
    const firstWalletName = firstWallet.value.ELEMENT
    await client.click('label.ms-ChoiceField-field span')
    await client.waitUntilWindowLoaded(3000)

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName)
  })

  app.test('delete wallet from menu', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()
    await app.createWalletFromSettings()

    // Get current wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)

    // Click delete wallet menu item
    await app.clickMenu(['Wallet', 'Delete Current Wallet'])
    await client.waitUntilWindowLoaded()

    // Input password
    const inputElement = await client.element('//INPUT')
    expect(inputElement.value).not.toBeNull()
    await app.setElementValue('//INPUT', 'Azusa2233')
    // Confirm
    client.click('button[name=confirm]')
    await client.waitUntilWindowLoaded()

    // Check wallet name
    const newWalletNameElement = await client.element('//MAIN/DIV/H1')
    expect(newWalletNameElement.value).not.toBeNull()
    await client.waitUntilWindowLoaded()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).not.toBe(walletName.value)
  })

  app.test('edit wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()

    await app.gotoSettingsView()
    await client.waitUntilWindowLoaded()

    // Switch to wallet setting
    client.click('button[name=Wallets]')
    await client.waitUntilWindowLoaded()

    // Get wallet id
    const walletItemElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]/DIV/INPUT')
    expect(walletItemElement.value).not.toBeNull()
    const walletItemElementId = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'id')
    const walletItemElementName = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'name')
    const walletId = walletItemElementId.value.slice(walletItemElementName.value.length + 1)

    // Go to edit wallet page
    await app.editWallet(walletId)
    await client.waitUntilWindowLoaded()

    // Update wallet name
    const walletNameInputElement = await client.element('<input />')
    expect(walletNameInputElement.value).not.toBeNull()
    await app.setElementValue('<input />', 'Azusa')
    await client.waitUntilWindowLoaded()
    const walletNameInputText = await client.elementIdAttribute(walletNameInputElement.value.ELEMENT, 'value')
    await client.waitUntilWindowLoaded()
    // Save
    client.click('button[name=save-wallet]')
    await client.waitUntilWindowLoaded()
    await client.pause(2000)

    // Check wallet name
    const newWalletNameElement = await client.element('label span')
    expect(newWalletNameElement).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    await client.waitUntilWindowLoaded()
    expect(newWalletName.value).toBe(walletNameInputText.value)
  })

  describe('Test field boundary', () => {
    app.test('Whitespace is disallowed in password when creating wallets', async () => {
      await app.spectron.client.waitUntilWindowLoaded()
      await app.createWalletFromWizard()

      const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
      const password = ' Aa11 1111 111 '
      const { client } = app.spectron
      app.clickMenu(['Wallet', 'Import Wallet', 'Import Wallet Seed'])
      await client.waitUntilWindowLoaded()
      client.setValue('textarea', mnemonicText)
      await client.waitUntilWindowLoaded()
      client.click('button[type=submit]')
      await client.waitUntilWindowLoaded()
      client.setValue('input[type=password]', password)
      await client.waitUntilWindowLoaded()
      expect(await client.getValue('input[type=password]')).toEqual(
        Array.from({ length: 2 }, () => password.replace(/\s/g, '')),
      )
    })

    app.test('Whitespace is disallowed in password when requesting the password', async () => {
      const password = ' Aa22 222 222 '
      const dialogPasswordSelector = 'div[role=dialog] input[type=password]'
      const { client } = app.spectron

      await app.spectron.client.waitUntilWindowLoaded()
      await app.createWalletFromWizard()

      app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await client.waitUntilWindowLoaded()
      client.setValue(dialogPasswordSelector, password)
      await client.waitUntilWindowLoaded()
      expect(await client.getValue(dialogPasswordSelector)).toBe(password.replace(/\s/g, ''))
      client.keys(['Escape'])
      await client.waitUntilWindowLoaded()
    })
  })
}
