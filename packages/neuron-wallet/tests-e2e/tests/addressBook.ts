import Application from '../application'
import { createWallet } from '../operations'

/**
 * 1. navigate to the address book
 * 2. verify the count of receiving/changing addresses
 * 3. verify default data of the first address
 * 4. update description of the first address
 * 5. refresh the view and verify the description
 */
export default (app: Application) => {
  beforeAll(async () => {
    // create a new wallet and navigate to the Send View
    const { client } = app.spectron
    await app.waitUntilLoaded()
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)
    await createWallet(app)
    await app.waitUntilLoaded()
  })

  app.test('Go to addresses tab', async () => {
    const { client } = app.spectron
    client.click('button[name=Addresses]')
    await app.waitUntilLoaded()
    await app.wait(1000)
  })

  app.test('Address book should have 20 receiving addresses and 10 change addresses', async () => {
    const { client } = app.spectron
    app.wait(1000)
    const countOfReceivingAddresses = await client
      .elements('//SPAN[text()="Receiving Address"]')
      .then(res => res.value.length)
    expect(countOfReceivingAddresses).toBe(20)
    app.wait(1000)
    const countOfChangeAddresses = await client
      .elements('//SPAN[text()="Change Address"]')
      .then(res => res.value.length)
    expect(countOfChangeAddresses).toBe(10)
  })

  app.test('Update description', async () => {
    const newDescription = 'new description'
    const descriptionCellSelector = 'div[data-automation-key=description]'
    const editButtonSelector = 'i[data-icon-name=Edit]'
    const inputSelector = 'div[role=row] input'
    const { client } = app.spectron

    const descriptionBeforeUpdate = await client.$(inputSelector).getValue()
    expect(descriptionBeforeUpdate).toBe('')

    client.moveToObject(descriptionCellSelector)
    await app.waitUntilLoaded()
    client.click(editButtonSelector)
    await app.waitUntilLoaded()

    client.setValue(inputSelector, newDescription)
    await app.waitUntilLoaded()

    client.click('button[name=Overview]')
    await app.waitUntilLoaded()
    client.click('button[name=Addresses]')
    await app.waitUntilLoaded()

    const descriptionAfterUpdate = await client.$(inputSelector).getValue()
    expect(descriptionAfterUpdate).toBe(newDescription)
  })
}
