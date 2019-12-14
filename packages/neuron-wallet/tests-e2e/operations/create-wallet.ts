import Application from '../application'
import { importWallet } from './import-wallet'

export const createWallet = async (app: Application, name: string | undefined = undefined, password: string = 'Azusa2233') => {
  const { client } = app.spectron

  // Copy mnemonic
  const mnemonicTextarea = await client.element('<textarea />')
  const mnemonic = await client.elementIdText(mnemonicTextarea.value.ELEMENT)

  // Next
  client.click('button[aria-label="next"]')
  await client.waitUntilWindowLoaded()

  return await importWallet(app, mnemonic.value, name, password)
}
