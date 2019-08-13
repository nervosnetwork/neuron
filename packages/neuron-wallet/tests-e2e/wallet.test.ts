import { Application } from 'spectron'
import path from 'path'
import { getElementByTagName, clickMenu, editWallet } from './utils'
import fs from 'fs'

// Test create/import/switch/delete/edit wallet
describe('wallet tests', () => {
  let app: Application

  beforeAll(() => {
    let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }
    app = new Application({ 
      args: [
        '--require',
        path.join(__dirname, 'preload.js'),
        path.join(__dirname, '..', 'dist', 'main.js'),
        '--lang=en'
      ], 
      path: electronPath 
    })
    return app.start()
  })

  afterAll(() => {
    if (app.isRunning) {
      return app.stop()
    }
  })

  const waitUntilLoaded = async () => {
    const { client } = app
    await client.pause(100)
    await client.waitUntilWindowLoaded()
  }

  it('create wallet', async () => {
    const { client } = app
    await client.waitUntilWindowLoaded(10000)

    // Click create wallet
    const createWalletButton = await getElementByTagName(client, 'button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    // Copy mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
    const mnemonicText = mnemonic.value
    // Next
    const mnemonicNextButton = await getElementByTagName(client, 'button', 'Next')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)
    await waitUntilLoaded()

    // Input mnemonic
    const inputMnemonicTextarea = await client.element('<textarea />')
    expect(inputMnemonicTextarea.value).not.toBeNull()
    await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, mnemonicText)
    // Next
    const inputMnemonicNextButton = await getElementByTagName(client, 'button', 'Next')
    expect(inputMnemonicNextButton).not.toBeNull()
    await client.elementIdClick(inputMnemonicNextButton!.ELEMENT)

    // Setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, 'Azusa2233')
    await client.elementIdValue(inputElements.value[2].ELEMENT, 'Azusa2233')
    // Next
    const setupWalletNextButton = await getElementByTagName(client, 'button', 'Next')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    if (walletNameElement.value === null) {
      const imageBuffer = await app.browserWindow.capturePage()
      fs.writeFileSync(path.join(__dirname, 'fail-create-wallet_check-wallet-name.png'), imageBuffer)
    }
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
    console.log(`walletName = ${walletName.value}`);
  })

  it('import wallet', async () => {
    const { client } = app
    await client.waitUntilWindowLoaded()

    // Go to setting page
    const networkElement = await client.element('//FOOTER/DIV[1]/DIV[2]')
    expect(networkElement.value).not.toBeNull()
    await client.elementIdClick(networkElement.value.ELEMENT)
    await waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await waitUntilLoaded()

    // Go to import wallet page
    const importWalletButton = await getElementByTagName(client, 'button', 'Import Mnemonic Seed')
    expect(importWalletButton).not.toBeNull()
    await client.elementIdClick(importWalletButton!.ELEMENT)

    // Input mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    expect(mnemonicTextarea.value).not.toBeNull()
    const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
    // Next
    await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonicText)
    const mnemonicNextButton = await getElementByTagName(client, 'button', 'Next')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // Setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, 'Azusa2233')
    await client.elementIdValue(inputElements.value[2].ELEMENT, 'Azusa2233')
    console.log(`walletNameInputText - ${walletNameInputText.value}`);
    // Next
    const setupWalletNextButton = await getElementByTagName(client, 'button', 'Next')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
  })

  it('switch to first wallet', async () => {
    const { client, electron } = app
    await client.waitUntilWindowLoaded()

    // Go to setting page
    await clickMenu(electron, ['Electron', 'Preferences...'])
    await waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await waitUntilLoaded()

    // Switch to first wallet
    const firstWallet = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV')
    expect(firstWallet).not.toBeNull()
    const firstWalletName = await client.elementIdText(firstWallet.value.ELEMENT)
    await client.elementIdClick(firstWallet.value.ELEMENT)
    await waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName.value)
  })

  it('delete wallet from menu', async () => {
    const { client, electron } = app
    await client.waitUntilWindowLoaded()

    // Get current wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    
    // Click delete wallet menu item
    await clickMenu(electron, ['Wallet', 'Delete Current Wallet'])
    await waitUntilLoaded()
    
    // Input password
    const inputElement = await client.element('//INPUT')
    expect(inputElement.value).not.toBeNull()
    await client.elementIdValue(inputElement.value.ELEMENT, 'Azusa2233')
    // Confirm
    const confirmButton = await getElementByTagName(client, 'button', 'Confirm')
    expect(confirmButton).not.toBeNull()
    await client.elementIdClick(confirmButton!.ELEMENT)
    await waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await client.element('//MAIN/DIV/H1')
    expect(newWalletNameElement.value).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).not.toBe(walletName.value)
  })

  it('edit wallet', async () => {
    const { client, electron } = app
    await client.waitUntilWindowLoaded()

    // Go to setting page
    await clickMenu(electron, ['Electron', 'Preferences...'])
    await waitUntilLoaded()

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', 'Wallets')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await waitUntilLoaded()

    // Get wallet id
    const walletItemElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]/DIV/INPUT')
    expect(walletItemElement.value).not.toBeNull()
    const walletItemElementId = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'id')
    const walletItemElementName = await client.elementIdAttribute(walletItemElement.value.ELEMENT, 'name')
    const walletId = walletItemElementId.value.slice(walletItemElementName.value.length + 1)

    // Go to edit wallet page
    await editWallet(electron, walletId)
    await waitUntilLoaded()

    // Update wallet name
    const walletNameInputElement = await client.element('<input />')
    expect(walletNameInputElement.value).not.toBeNull()
    await client.elementIdValue(walletNameInputElement.value.ELEMENT, 'Azusa')
    const walletNameInputText = await client.elementIdAttribute(walletNameInputElement.value.ELEMENT, 'value')
    console.log(`walletNameInputText - ${walletNameInputText.value}`);
    // Save
    const saveButton = await getElementByTagName(client, 'button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await waitUntilLoaded()

    // Check wallet name
    const newWalletNameElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[1]')
    expect(newWalletNameElement).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).toBe(walletNameInputText.value)
    console.log(`newWalletName - ${newWalletName.value}`);
  })
})
