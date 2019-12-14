import Application from '../application'

/**
 * 1. navigate to the address book
 * 2. verify the count of receiving/changing addresses
 * 3. verify default data of the first address
 * 4. update description of the first address
 * 5. refresh the view and verify the description
 */
export default (app: Application) => {
  beforeEach(async () => {
    await app.spectron.client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()

    app.spectron.client.click('button[name=Addresses]')
    await app.spectron.client.waitUntilWindowLoaded()
  })

  app.test('Address book should have 20 receiving addresses and 10 change addresses', async () => {
    const { client } = app.spectron
    await app.wait(1000)
    const countOfReceivingAddresses = await client
      .elements('//SPAN[text()="Receiving Address"]')
      .then(res => res.value.length)
    expect(countOfReceivingAddresses).toBe(20)
    await app.wait(1000)
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
    await client.waitUntilWindowLoaded()
    client.click(editButtonSelector)
    await client.waitUntilWindowLoaded()

    client.setValue(inputSelector, newDescription)
    await client.waitUntilWindowLoaded()
    await client.pause(1000)

    client.click('button[name=Overview]')
    await client.waitUntilWindowLoaded()
    client.click('button[name=Addresses]')
    await client.waitUntilWindowLoaded()

    const descriptionAfterUpdate = await client.$(inputSelector).getValue()
    expect(descriptionAfterUpdate).toBe(newDescription)
  })
}
