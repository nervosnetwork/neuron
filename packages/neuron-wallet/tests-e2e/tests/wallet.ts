import Application from '../application'
import { createWallet, importWallet } from '../operations'

// Start: Guide page
// End: Overview page
export default (app: Application) => {
  app.test('create wallet', async () => {
    const { client } = app.spectron
    await app.waitUntilLoaded()

    // Click create wallet
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    await createWallet(app)
    await app.waitUntilLoaded()
  })

  app.test('import wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    await app.gotoSettingsView()
    await app.waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Go to import wallet page
    const importWalletButton = await app.getElementByTagName('button', 'Import Wallet Seed')
    expect(importWalletButton).not.toBeNull()
    await client.elementIdClick(importWalletButton!.ELEMENT)

    const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
    await importWallet(app, mnemonicText)
    app.waitUntilLoaded()
  })

  app.test('switch to first wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    await app.gotoSettingsView()
    await app.waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Switch to first wallet
    const firstWallet = await client.element('label span')
    expect(firstWallet).not.toBeNull()
    const firstWalletName = await client.elementIdText(firstWallet.value.ELEMENT)
    await client.elementIdClick(firstWallet.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName.value)
  })

  app.test('delete wallet from menu', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Get current wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)

    // Click delete wallet menu item
    await app.clickMenu(['Wallet', 'Delete Current Wallet'])
    await app.waitUntilLoaded()

    // Input password
    const inputElement = await client.element('//INPUT')
    expect(inputElement.value).not.toBeNull()
    await app.setElementValue('//INPUT', 'Azusa2233')
    // Confirm
    const confirmButton = await app.getElementByTagName('button', 'Confirm')
    expect(confirmButton).not.toBeNull()
    await client.elementIdClick(confirmButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await client.element('//MAIN/DIV/H1')
    expect(newWalletNameElement.value).not.toBeNull()
    await app.waitUntilLoaded()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).not.toBe(walletName.value)
  })

  app.test('edit wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    await app.gotoSettingsView()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Get wallet id
    const walletItemElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]/DIV/INPUT')
    expect(walletItemElement.value).not.toBeNull()
    const walletItemElementId = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'id')
    const walletItemElementName = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'name')
    const walletId = walletItemElementId.value.slice(walletItemElementName.value.length + 1)

    // Go to edit wallet page
    await app.editWallet(walletId)
    await app.waitUntilLoaded()

    // Update wallet name
    const walletNameInputElement = await client.element('<input />')
    expect(walletNameInputElement.value).not.toBeNull()
    await app.setElementValue('<input />', 'Azusa')
    await app.waitUntilLoaded()
    const walletNameInputText = await client.elementIdAttribute(walletNameInputElement.value.ELEMENT, 'value')
    await app.waitUntilLoaded()
    // Save
    const saveButton = await app.getElementByTagName('button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await client.element('label span')
    expect(newWalletNameElement).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).toBe(walletNameInputText.value)
  })

  describe('Test field boundary', () => {
    app.test('Whitespace is disallowed in password when creating wallets', async () => {
      const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
      const password = ' Aa11 1111 111 '
      const { client } = app.spectron
      app.clickMenu(['Wallet', 'Import Wallet', 'Import Wallet Seed'])
      await app.waitUntilLoaded()
      client.setValue('textarea', mnemonicText)
      await app.waitUntilLoaded()
      client.click('button[type=submit]')
      await app.waitUntilLoaded()
      client.setValue('input[type=password]', password)
      await app.waitUntilLoaded()
      expect(await client.getValue('input[type=password]')).toEqual(
        Array.from({ length: 2 }, () => password.replace(/\s/g, '')),
      )
    })

    app.test('Whitespace is disallowed in password when requesting the password', async () => {
      const password = ' Aa22 222 222 '
      const dialogPasswordSelector = 'div[role=dialog] input[type=password]'
      const { client } = app.spectron

      app.clickMenu(['Wallet', 'Delete Current Wallet'])
      await app.waitUntilLoaded()
      client.setValue(dialogPasswordSelector, password)
      await app.waitUntilLoaded()
      expect(await client.getValue(dialogPasswordSelector)).toBe(password.replace(/\s/g, ''))
      client.keys(['Escape'])
      await app.waitUntilLoaded()
    })
  })
}
