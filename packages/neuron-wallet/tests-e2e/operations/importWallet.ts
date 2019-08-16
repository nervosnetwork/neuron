import Application from '../application'

export const importWallet = async (app: Application, mnemonic: string, password: string = 'Azusa2233') => {
  const { client } = app.spectron
  
    // Input mnemonic
    const mnemonicTextarea = await client.element('<textarea />')
    expect(mnemonicTextarea.value).not.toBeNull()
    // Next
    await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonic)
    const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // Setup wallet
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, password)
    await client.elementIdValue(inputElements.value[2].ELEMENT, password)
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
}
