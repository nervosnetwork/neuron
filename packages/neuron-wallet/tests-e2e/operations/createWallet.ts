import Application from '../application'
import { sleep } from '../application/utils'

export const createWallet = async (app: Application, password: string = 'Azusa2233') => {
  const { client } = app.spectron
  
  // Copy mnemonic
  const mnemonicTextarea = await app.element('<textarea />')
  const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
  let mnemonicText = mnemonic.value
  console.log(`mnemonicText = ${mnemonicText} ${new Date().toTimeString()}`);
  
  // Next
  const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
  expect(mnemonicNextButton).not.toBeNull()
  await client.elementIdClick(mnemonicNextButton!.ELEMENT)
  await app.waitUntilLoaded()
  console.log(`copy mnemonic finish ${new Date().toTimeString()}`);

  // back
  const backButton = await app.getElementByTagName('button', 'Back')
  expect(backButton).not.toBeNull()
  await client.elementIdClick(backButton!.ELEMENT)
  await app.waitUntilLoaded()
  console.log(`back finish ${new Date().toTimeString()}`);
  // Copy mnemonic
  const mnemonicTextarea2 = await app.element('<textarea />')
  expect(mnemonicTextarea2.value).not.toBeNull()
  const mnemonic2 = await client.elementIdText(mnemonicTextarea2.value.ELEMENT)
  mnemonicText = mnemonic2.value
  console.log(`mnemonicText2 = ${mnemonicText} ${new Date().toTimeString()}`);
  // next
  const nextButton = await app.getElementByTagName('button', 'Next')
  expect(nextButton).not.toBeNull()
  await client.elementIdClick(nextButton!.ELEMENT)
  await app.waitUntilLoaded()
  console.log(`next finish ${new Date().toTimeString()}`);


  // 

  // Input mnemonic
  const inputMnemonicTextarea = await app.element('<textarea />')
  expect(inputMnemonicTextarea.value).not.toBeNull()
  console.log(`will input mnemonic ${new Date().toTimeString()}`);
  // await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, mnemonicText)
  for (let index = 0; index < Math.ceil(mnemonicText.length / 6); index++) {
    const text = mnemonicText.slice(index * 6, Math.min(index * 6 + 6, mnemonicText.length))
    console.log(`input text = ${text}`);
    await client.elementIdValue(inputMnemonicTextarea.value.ELEMENT, text)
    sleep(200)
  }
  console.log(`input mnemonic finish ${new Date().toTimeString()}`);
  app.waitUntilLoaded()
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
