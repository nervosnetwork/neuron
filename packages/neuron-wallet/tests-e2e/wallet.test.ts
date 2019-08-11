import { Application } from 'spectron'
import path from 'path'
import { sleep, getElementByTagName } from './utils'

// Test create/import/switch/edit wallet
describe('wallet tests', () => {
  let app: Application

  beforeAll(() => {
    let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }
    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', 'dist', 'main.js')],
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

    // click create wallet
    const createWalletButton = await getElementByTagName(client, 'button', '创建新钱包')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    // copy mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
    const mnemonicText = mnemonic.value
    // next
    const mnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // input mnemonic
    const inputMnemonicTextarea = await client.element('<textarea />')
    expect(inputMnemonicTextarea.value).not.toBeNull()
    await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, mnemonicText)
    // next
    const inputMnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(inputMnemonicNextButton).not.toBeNull()
    await client.elementIdClick(inputMnemonicNextButton!.ELEMENT)

    // setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, 'Azusa2233')
    await client.elementIdValue(inputElements.value[2].ELEMENT, 'Azusa2233')
    // next
    const setupWalletNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    sleep(200)

    // test create success
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
    // next
    await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonicText)
    const mnemonicNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // // setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, 'Azusa2233')
    await client.elementIdValue(inputElements.value[2].ELEMENT, 'Azusa2233')
    // next
    const setupWalletNextButton = await getElementByTagName(client, 'button', '下一步')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    sleep(200)

    // test create success
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
  })

  it('switch wallet', async () => {
    const { client } = app

    // Go to setting page
    const networkElement = await client.element('//FOOTER/DIV[1]/DIV[2]')
    expect(networkElement).not.toBeNull()
    await client.elementIdClick(networkElement.value.ELEMENT)

    // Switch to wallet setting
    const walletSettingButton = await getElementByTagName(client, 'button', '钱包')
    expect(walletSettingButton).not.toBeNull()
    await client.elementIdClick(walletSettingButton!.ELEMENT)
    sleep(200)

    // Switch to first wallet
    const firstWallet = await client.element('//MAIN/DIV[1]/DIV[3]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[1]')
    expect(firstWallet).not.toBeNull()
    const firstWalletName = await client.elementIdText(firstWallet.value.ELEMENT)
    await client.elementIdClick(firstWallet.value.ELEMENT)
    sleep(200)

    // test create success
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(firstWalletName.value)
  })


  // TODO: edit wallet
  // await client.rightClick('//MAIN/DIV[1]/DIV[3]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[1]')

  // TODO: wallet menu
  // const menu = electron.Menu.getApplicationMenu()
})
