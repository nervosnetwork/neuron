import Application from '../application'

export const createWallet = async (app: Application, password: string = 'Azusa2233') => {
  const { client } = app.spectron
  
  // Copy mnemonic
  const mnemonicTextarea = await app.element('<textarea />')
  const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
  const mnemonicText = mnemonic.value
  console.log(`mnemonicText = ${mnemonicText} ${new Date().toTimeString()}`);
  
  // Next
  const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
  expect(mnemonicNextButton).not.toBeNull()
  await client.elementIdClick(mnemonicNextButton!.ELEMENT)
  await app.waitUntilLoaded()
  console.log(`copy mnemonic finish ${new Date().toTimeString()}`);

  // Input mnemonic
  const inputMnemonicTextarea = await app.element('<textarea />')
  expect(inputMnemonicTextarea.value).not.toBeNull()
  await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, mnemonicText)
  // Next
  const inputMnemonicNextButton = await app.getElementByTagName('button', 'Next')
  expect(inputMnemonicNextButton).not.toBeNull()
  await client.elementIdClick(inputMnemonicNextButton!.ELEMENT)
  console.log(`input mnemonic finish ${new Date().toTimeString()}`);
  

  // Setup wallet
  const inputElements = await app.elements('<input />')
  expect(inputElements.value).not.toBeNull()
  expect(inputElements.value.length).toBe(3)
  const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
  await client.elementIdValue(inputElements.value[1].ELEMENT, password)
  await client.elementIdValue(inputElements.value[2].ELEMENT, password)
  // Next
  const setupWalletNextButton = await app.getElementByTagName('button', 'Next')
  expect(setupWalletNextButton).not.toBeNull()
  await client.elementIdClick(setupWalletNextButton!.ELEMENT)
  await app.waitUntilLoaded()
  console.log(`setup wallet finish ${new Date().toTimeString()}`);

  // Check wallet name
  const walletNameElement = await app.element('//MAIN/DIV/H1')
  if (walletNameElement.value === null) {
    const mainElement = await app.element('//MAIN')
    expect(mainElement.value).not.toBeNull()
    const mainText = await client.elementIdText(mainElement.value.ELEMENT)
    console.log(`mainText = ${mainText.value}`);
  }
  expect(walletNameElement.value).not.toBeNull()
  const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
  expect(walletName.value).toBe(walletNameInputText.value)
  console.log(`new wallet name ${walletName.value} ${new Date().toTimeString()}`);
  
  return walletName.value
}
