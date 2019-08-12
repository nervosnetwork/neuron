import { Application } from 'spectron'
import path from 'path'
import { getElementByTagName } from './utils'
import menuAddon from 'spectron-menu-addon'

// Test create/import/switch/edit wallet
describe('wallet tests', () => {
  let app: Application

  beforeAll(() => {
    let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }
    app = menuAddon.createApplication({ 
      args: [path.join(__dirname, '..', 'dist', 'main.js')], 
      path: electronPath 
    })
    return app.start()
  })

  afterAll(() => {
    if (app.isRunning) {
      return app.stop()
    }
  })

  it('create wallet', async () => {
    const { client } = app
    await client.waitUntilWindowLoaded()

    // Click create wallet
    const createWalletButton = await getElementByTagName(client, 'button', '创建新钱包')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    // Copy mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
    const mnemonicText = mnemonic.value
    // Next
    const mnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // Input mnemonic
    const inputMnemonicTextarea = await client.element('<textarea />')
    expect(inputMnemonicTextarea.value).not.toBeNull()
    await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, mnemonicText)
    // Next
    const inputMnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
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
    const setupWalletNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await client.pause(200)

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
  })

  it('import wallet', async () => {
    const { client } = app

    // Go to setting page
    const networkElement = await client.element('//FOOTER/DIV[1]/DIV[2]')
    expect(networkElement.value).not.toBeNull()
    await client.elementIdClick(networkElement.value.ELEMENT)

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', '钱包')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)

    // Go to import wallet page
    const importWalletButton = await getElementByTagName(client, 'button', '导入钱包')
    expect(importWalletButton).not.toBeNull()
    await client.elementIdClick(importWalletButton!.ELEMENT)

    // Input mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    expect(mnemonicTextarea.value).not.toBeNull()
    const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
    // Next
    await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonicText)
    const mnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // Setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, 'Azusa2233')
    await client.elementIdValue(inputElements.value[2].ELEMENT, 'Azusa2233')
    // Next
    const setupWalletNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await client.pause(200)

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
  })

  it('switch to first wallet', async () => {
    const { client } = app

    // Go to setting page
    const networkElement = await client.element('//FOOTER/DIV[1]/DIV[2]')
    expect(networkElement).not.toBeNull()
    await client.elementIdClick(networkElement.value.ELEMENT)

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', '钱包')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await client.pause(200)

    // Switch to first wallet
    const firstWallet = await client.element('//MAIN/DIV[1]/DIV[3]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[1]')
    expect(firstWallet).not.toBeNull()
    const firstWalletName = await client.elementIdText(firstWallet.value.ELEMENT)
    await client.elementIdClick(firstWallet.value.ELEMENT)
    await client.pause(200)

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName.value)
  })

  it('delete wallet from menu', async () => {
    const { client } = app

    // Get current wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    
    // Click delete wallet menu item
    await menuAddon.clickMenu('Wallet', 'Delete Current Wallet')
    await client.pause(200)
    
    // Input password
    const inputElement = await client.element('//INPUT')
    expect(inputElement.value).not.toBeNull()
    await client.elementIdValue(inputElement.value.ELEMENT, 'Azusa2233')
    // Confirm
    const confirmButton = await getElementByTagName(client, 'button', '确认')
    expect(confirmButton).not.toBeNull()
    await client.elementIdClick(confirmButton!.ELEMENT)

    // Check wallet name
    const newWalletNameElement = await client.element('//MAIN/DIV/H1')
    expect(newWalletNameElement.value).not.toBeNull()
    const newWalletName = await client.elementIdText(newWalletNameElement.value.ELEMENT)
    expect(newWalletName.value).not.toBe(walletName.value)
  })


  // TODO: edit wallet
  // Unable to get context menu directly
  it('edit wallet', async () => {
    return
    const { client } = app

    // Go to setting page
    await menuAddon.clickMenu('Electron', 'Preferences...')
    await client.pause(200)

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', '钱包')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    await client.pause(200)

    // Trigger context menu
    await client.rightClick('//MAIN/DIV[1]/DIV[3]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[2]', 40, 5 + 10)
    await client.pause(200)

    // TODO: Click edit menu item
  })
})
