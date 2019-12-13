import Application from '../application'

export const currentWalletAddress = async (app: Application) => {
  const { client } = app.spectron

  // Switch to receive page
  client.click('button[name=Receive]')
  await app.waitUntilLoaded(2000)

  const addressElement = await client.element('//INPUT')
  expect(addressElement.value).not.toBeNull()
  const address = await client.elementIdAttribute(addressElement.value.ELEMENT, 'placeholder')
  await app.waitUntilLoaded(2000)

  // Back
  client.click('button[name=Overview]')
  await app.waitUntilLoaded()

  return address.value
}
