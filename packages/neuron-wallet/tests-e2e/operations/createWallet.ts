import Application from '../application'
import { importWallet } from './importWallet'

export const createWallet = async (app: Application, name: string | undefined = undefined, password: string = 'Azusa2233') => {
  const { client } = app.spectron

  // Copy mnemonic
  const mnemonicTextarea = await client.element('<textarea />')
  const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)
  let mnemonicText = mnemonic.value

  // Next
  client.click('button[aria-label="next"]')
  await app.waitUntilLoaded()

  return await importWallet(app, mnemonicText, name, password)
}
