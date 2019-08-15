import Application from './application'

describe('wallet tests', () => {
  let app: Application

  beforeAll(() => {
    app = new Application()
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  it('import wallet', async () => {
    const { client } = app.spectron
    await app.waitUntilLoaded()

    // Go to import wallet page
    const createWalletButton = await app.getElementByTagName('button', 'Import Mnemonic Seed')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    // Input mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    expect(mnemonicTextarea.value).not.toBeNull()
    const mnemonicText = 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog'
    // Next
    await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonicText)
    const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
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
    const setupWalletNextButton = await app.getElementByTagName('button', 'Next')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await client.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
    console.log(`walletName - ${walletName.value}  ${new Date().toTimeString()}`);
  })

})