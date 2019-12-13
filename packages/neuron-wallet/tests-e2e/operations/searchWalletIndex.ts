import Application from '../application'

export const searchWalletIndex = async (app: Application, walletName: string) => {
  const { client } = app.spectron
  let walletIndex: number | null = null

  await app.gotoSettingsView()

  // Switch to wallet setting
  const walletSettingButton = await app.getElementByTagName('button', 'Wallets')
  expect(walletSettingButton).not.toBeNull()
  await client.elementIdClick(walletSettingButton!.ELEMENT)
  await app.waitUntilLoaded()

  // Get wallet count
  const groupElementPath = '//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV'
  const result = await client.selectorExecute(groupElementPath, (elements: any) => `${elements[0].childElementCount}`)
  const walletCount = parseInt(result)

  // Search wallet
  for (let index = 1; index <= walletCount; index++) {
    const elementPath = `${groupElementPath}/DIV[${index}]`
    const element = await client.element(elementPath)
    expect(element.value).not.toBeNull()
    const text = await client.elementIdText(element.value.ELEMENT)
    if (text.value === walletName) {
      walletIndex = index
      break
    }
  }

  // Back
  const backButton = await client.element('//MAIN/DIV/DIV/DIV/BUTTON')
  expect(backButton.value).not.toBeNull()
  await client.elementIdClick(backButton.value.ELEMENT)
  await app.waitUntilLoaded()

  console.log(`searchWalletIndex - ${walletName}: ${walletIndex}`);
  return walletIndex
}
