import Application from './application'
import { createWallet, importWallet } from './operations'

// Test create/import/switch/delete/edit wallet
describe('wallet tests', () => {
  let app = new Application()

  beforeAll(() => {
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  app.test('create wallet', async () => {
    const { client } = app.spectron
    await app.waitUntilLoaded()

    // Click create wallet
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)
    console.log(`clicked create wallet button ${new Date().toTimeString()}`);

    await createWallet(app)
    await app.waitUntilLoaded()
  })

  app.test('import wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Go to setting page
    const networkElement = await app.element('//FOOTER/DIV[1]/DIV[2]')
    expect(networkElement.value).not.toBeNull()
    await client.elementIdClick(networkElement.value.ELEMENT)
    await app.waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Go to import wallet page
    const importWalletButton = await app.getElementByTagName('button', 'Import Mnemonic Seed')
    expect(importWalletButton).not.toBeNull()
    await client.elementIdClick(importWalletButton!.ELEMENT)

    const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
    await importWallet(app, mnemonicText)
    app.waitUntilLoaded()
  })

  app.test('switch to first wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Go to setting page
    await app.clickMenu(['Electron', 'Preferences...'])
    await app.waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Switch to first wallet
    const firstWallet = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV')
    expect(firstWallet).not.toBeNull()
    const firstWalletName = await client.elementIdText(firstWallet.value.ELEMENT)
    await client.elementIdClick(firstWallet.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await app.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName.value)
  })

  app.test('delete wallet from menu', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Get current wallet name
    const walletNameElement = await app.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    
    // Click delete wallet menu item
    await app.clickMenu(['Wallet', 'Delete Current Wallet'])
    await app.waitUntilLoaded()
    
    // Input password
    const inputElement = await app.element('//INPUT')
    expect(inputElement.value).not.toBeNull()
    await client.elementIdValue(inputElement.value.ELEMENT, 'Azusa2233')
    // Confirm
    const confirmButton = await app.getElementByTagName('button', 'Confirm')
    expect(confirmButton).not.toBeNull()
    await client.elementIdClick(confirmButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await app.element('//MAIN/DIV/H1')
    expect(newWalletNameElement.value).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).not.toBe(walletName.value)
  })

  app.test('edit wallet', async () => {
    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Go to setting page
    await app.clickMenu(['Electron', 'Preferences...'])
    await app.waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Get wallet id
    const walletItemElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]/DIV/INPUT')
    expect(walletItemElement.value).not.toBeNull()
    const walletItemElementId = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'id')
    const walletItemElementName = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'name')
    const walletId = walletItemElementId.value.slice(walletItemElementName.value.length + 1)

    // Go to edit wallet page
    await app.editWallet(walletId)
    await app.waitUntilLoaded()

    // Update wallet name
    const walletNameInputElement = await app.element('<input />')
    expect(walletNameInputElement.value).not.toBeNull()
    await client.elementIdValue(walletNameInputElement.value.ELEMENT, 'Azusa')
    const walletNameInputText = await client.elementIdAttribute(walletNameInputElement.value.ELEMENT, 'value')
    console.log(`walletNameInputText - ${walletNameInputText.value}`);
    await app.waitUntilLoaded()
    // Save
    const saveButton = await app.getElementByTagName('button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]')
    expect(newWalletNameElement).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).toBe(walletNameInputText.value)
    console.log(`newWalletName - ${newWalletName.value}`);
  })
})
