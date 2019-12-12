import { debuglog } from 'util'
import Application from '../application'
const log = debuglog(__filename)

export const importWallet = async (app: Application, mnemonic: string, name: string | undefined = undefined, password: string = 'Azusa2233') => {
  const { client } = app.spectron

  // Input mnemonic
  const inputMnemonicTextarea = await app.element('<textarea />')
  expect(inputMnemonicTextarea.value).not.toBeNull()
  app.setElementValue('<textarea />', mnemonic)
  app.waitUntilLoaded()
  // Next
  const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
  expect(mnemonicNextButton).not.toBeNull()
  await client.elementIdClick(mnemonicNextButton!.ELEMENT)

  // Setup wallet
  const inputElements = await app.elements('<input />')
  expect(inputElements.value).not.toBeNull()
  expect(inputElements.value.length).toBe(3)
  if (name) {
    await app.setElementValue('//MAIN/DIV/DIV[1]//INPUT', name)
  }
  await app.setElementValue('//MAIN/DIV/DIV[2]//INPUT', password)
  await app.setElementValue('//MAIN/DIV/DIV[3]//INPUT', password)
  const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
  await app.waitUntilLoaded()
  log(`walletNameInputText - ${walletNameInputText.value}`);
  // Next
  const setupWalletNextButton = await app.getElementByTagName('button', 'Next')
  expect(setupWalletNextButton).not.toBeNull()
  await client.elementIdClick(setupWalletNextButton!.ELEMENT)
  await app.waitUntilLoaded()

  // Check wallet name
  const walletNameElement = await app.element('//MAIN/DIV/H1', 1000)
  expect(walletNameElement.value).not.toBeNull()
  const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
  expect(walletName.value).toBe(walletNameInputText.value)
  log(`walletName - ${walletName.value}  ${new Date().toTimeString()}`);

  return walletName.value
}
