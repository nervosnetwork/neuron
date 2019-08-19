import Application from '../application'
import { importWallet } from './importWallet'

export const createWallet = async (app: Application, name: string | undefined = undefined, password: string = 'Azusa2233') => {
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

  return await importWallet(app, mnemonicText, name, password)
}
