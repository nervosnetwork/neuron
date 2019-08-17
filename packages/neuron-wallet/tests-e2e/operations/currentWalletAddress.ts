import Application from '../application'

export const currentWalletAddress = async (app: Application) => {
  const { client } = app.spectron

  // Switch to receive page
  const receiveButton = await app.getElementByTagName('button', 'Receive')
  expect(receiveButton).not.toBeNull()
  await client.elementIdClick(receiveButton!.ELEMENT)
  await app.waitUntilLoaded()

  const addressElement = await app.element('//INPUT')
  expect(addressElement.value).not.toBeNull()
  const address = await client.elementIdAttribute(addressElement.value.ELEMENT, 'placeholder')
  console.log(`address = ${address.value}`);
  await app.waitUntilLoaded()

  // Back
  const overviewButton = await app.getElementByTagName('button', 'Overview')
  expect(overviewButton).not.toBeNull()
  await client.elementIdClick(overviewButton!.ELEMENT)
  await app.waitUntilLoaded()
  
  return address.value
}
