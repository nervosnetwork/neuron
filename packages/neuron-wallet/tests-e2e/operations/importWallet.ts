import Application from '../application'

export const importWallet = async (app: Application, mnemonic: string, name: string | undefined = undefined, password: string = 'Azusa2233') => {
  const { client } = app.spectron

  // Input mnemonic
  const inputMnemonicTextarea = await client.element('<textarea />')
  expect(inputMnemonicTextarea.value).not.toBeNull()
  app.setElementValue('<textarea />', mnemonic)
  await app.waitUntilLoaded()
  // Next
  client.click('button[aria-label=next]')
  await app.waitUntilLoaded(3000)

  // Setup wallet
  const inputElements = await client.elements('<input />')
  expect(inputElements.value).not.toBeNull()
  expect(inputElements.value.length).toBe(3)
  if (name) {
    await app.setElementValue('//MAIN/DIV/DIV[1]//INPUT', name)
  }
  await app.setElementValue('//MAIN/DIV/DIV[2]//INPUT', password)
  await app.setElementValue('//MAIN/DIV/DIV[3]//INPUT', password)
  const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
  await app.waitUntilLoaded()
  // Next
  client.click('button[aria-label=next]')
  await app.waitUntilLoaded(3000)

  // Check wallet name
  const walletNameElement = await client.element('//MAIN/DIV/H1')
  expect(walletNameElement.value).not.toBeNull()
  const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
  expect(walletName.value).toBe(walletNameInputText.value)

  return walletName.value
}
