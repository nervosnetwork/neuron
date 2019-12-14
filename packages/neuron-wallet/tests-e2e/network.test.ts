import Application from './application';

describe('Wallet tests', () => {
  const app = new Application()
  beforeEach(() => app.start())
  afterEach(() =>  app.stop())

  const addNetwork = async () => {
    const { client } = app.spectron
    const newNodeName = 'Node-2233'
    const newNodeRpcUrl = 'http://localhost:8114'

    client.click('button[name=add-network]')
    await client.waitUntilWindowLoaded()

    // Setup Network
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeUndefined()
    expect(inputElements.value.length).toBe(2)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[1]//INPUT', newNodeRpcUrl)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[2]//INPUT', newNodeName)
    await client.waitUntilWindowLoaded()
    // Save
    client.click('button[name=save-network]')
    await client.waitUntilWindowLoaded()
    await client.pause(1000)

    // Check network name
    const title = `${newNodeName}: ${newNodeRpcUrl}`
    const newNetworkItemElement = await client.element("//MAIN//LABEL/DIV[@title='" + title + "']")
    expect(newNetworkItemElement.value).not.toBeUndefined()
  }

  beforeEach(async () => {
    await app.spectron.client.waitUntilWindowLoaded()
    await app.createWalletFromWizard()

    await app.gotoSettingsView()
    await app.spectron.client.waitUntilWindowLoaded()

    app.spectron.client.click('button[name=Network]')
    await app.spectron.client.waitUntilWindowLoaded()
  })

  app.test('add network', async () => {
    await addNetwork()
  })

  app.test('edit network', async () => {
    await addNetwork()

    const { client } = app.spectron
    await client.waitUntilWindowLoaded()

    // Get network id
    const inputs = await client.elements("//MAIN//INPUT")
    const networkItemElement = inputs.value[1]
    expect(networkItemElement).not.toBeUndefined()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement.ELEMENT, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement.ELEMENT, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)

    // Go to edit network page
    await app.editNetwork(networkId)
    await client.waitUntilWindowLoaded()

    // Setup Network
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeUndefined()
    expect(inputElements.value.length).toBe(2)
    const networkRpcUrlInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    const networkNameInputText = await client.elementIdAttribute(inputElements.value[1].ELEMENT, 'value')
    const newRpcUrl = `${networkRpcUrlInputText.value}22`
    const newName = `${networkNameInputText.value}33`
    await app.setElementValue('//MAIN/DIV/DIV/DIV[1]//INPUT', newRpcUrl)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[2]//INPUT', newName)
    await client.waitUntilWindowLoaded()

    // Save
    client.click('button[name=save-network]')
    await client.waitUntilWindowLoaded()
    await client.pause(1000)

    // Check network name
    const title = `${newName}: ${newRpcUrl}`
    const newNetworkItemElement = await client.element("//MAIN//LABEL/DIV[@title='" + title + "']")
    expect(newNetworkItemElement.value).not.toBeUndefined()
  })

  app.test('switch network', async () => {
    await addNetwork()

    const { client } = app.spectron

    // Get target network name
    const labels = await app.elements('//MAIN//LABEL//SPAN')
    const targetNetworkNameElement = labels.value[3]
    expect(targetNetworkNameElement).not.toBeUndefined()
    const targetNetowrkName = await client.elementIdText(targetNetworkNameElement.ELEMENT)

    // switch network
    const inputs = await app.elements("//MAIN//INPUT")
    const targetNetworkElement = inputs.value[1].ELEMENT
    await client.elementIdClick(targetNetworkElement)
    await client.waitUntilWindowLoaded()
    await client.pause(3000)

    // Check network name
    const networkElement = await client.element('[id=connected-network-name]')
    expect(networkElement).not.toBeUndefined()
    const networkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(networkName.value).toBe(targetNetowrkName.value)
  })

  app.test('delete network', async () => {
    await addNetwork()

    const { client } = app.spectron

    // Get network name
    const labels = await app.elements('//MAIN//LABEL//SPAN')
    const networkNameElement = labels.value[3]
    expect(networkNameElement).not.toBeUndefined()
    const netowrkName = await client.elementIdText(networkNameElement.ELEMENT)

    // Get network id
    const inputs = await app.elements("//MAIN//INPUT")
    const networkItemElement = inputs.value[1].ELEMENT
    expect(networkItemElement).not.toBeUndefined()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)

    // Delete network
    app.deleteNetwork(networkId)
    await client.waitUntilWindowLoaded()
    await client.pause(3000)

    // Check network name
    const networkElement = await client.element('[id=connected-network-name]')
    expect(networkElement).not.toBeUndefined()
    const newNetworkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(newNetworkName.value).not.toBe(netowrkName.value)
  })
})
