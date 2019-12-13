import Application from '../application';

export default (app: Application) => {
  app.test('add network', async () => {
    const { client } = app.spectron
    const newNodeName = 'Node-2233'
    const newNodeRpcUrl = 'http://localhost:8114'

    await app.gotoSettingsView()

    // Switch to network setting
    client.click('button[name=Network]')
    await app.waitUntilLoaded()

    // Click Add-Network
    const addNetworkButton = await client.element('//MAIN/DIV/DIV[3]/DIV[2]/BUTTON')
    expect(addNetworkButton.value).not.toBeNull()
    await client.elementIdClick(addNetworkButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Setup Network
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(2)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[1]//INPUT', newNodeRpcUrl)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[2]//INPUT', newNodeName)
    await app.waitUntilLoaded()
    // Save
    client.click('button[name=save-network]')
    await app.waitUntilLoaded()

    // Check network name
    const title = `${newNodeName}: ${newNodeRpcUrl}`
    const newNetworkItemElement = await client.element("//MAIN//LABEL/DIV[@title='" + title + "']")
    expect(newNetworkItemElement.value).not.toBeNull()
    console.log(`netowrkItemTitle - ${title}`);
  })

  app.test('edit network', async () => {
    const { client } = app.spectron

    // Get network id
    const inputs = await client.elements("//MAIN//INPUT")
    const networkItemElement = inputs.value[1]
    expect(networkItemElement).not.toBeNull()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement.ELEMENT, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement.ELEMENT, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)
    console.log(`networkId = ${networkId}`);

    // Go to edit network page
    await app.editNetwork(networkId)
    await app.waitUntilLoaded()

    // Setup Network
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(2)
    const networkRpcUrlInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    const networkNameInputText = await client.elementIdAttribute(inputElements.value[1].ELEMENT, 'value')
    const newRpcUrl = `${networkRpcUrlInputText.value}22`
    const newName = `${networkNameInputText.value}33`
    await app.setElementValue('//MAIN/DIV/DIV/DIV[1]//INPUT', newRpcUrl)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[2]//INPUT', newName)
    await app.waitUntilLoaded()

    // Save
    client.click('button[name=save-network]')
    await app.waitUntilLoaded()

    // Check network name
    const title = `${newName}: ${newRpcUrl}`
    const newNetworkItemElement = await client.element("//MAIN//LABEL/DIV[@title='" + title + "']")
    expect(newNetworkItemElement.value).not.toBeNull()
    console.log(`netowrkItemTitle - ${title}`);
  })

  app.test('switch network', async () => {
    const { client } = app.spectron

    // Get target network name
    const labels = await app.elements('//MAIN//LABEL//SPAN')
    const targetNetworkNameElement = labels.value[3]
    expect(targetNetworkNameElement).not.toBeNull()
    const targetNetowrkName = await client.elementIdText(targetNetworkNameElement.ELEMENT)

    // switch network
    const inputs = await app.elements("//MAIN//INPUT")
    const targetNetworkElement = inputs.value[1].ELEMENT
    await client.elementIdClick(targetNetworkElement)
    await app.waitUntilLoaded()

    // back
    const backButton = await client.element('//MAIN/DIV/DIV/DIV/BUTTON')
    expect(backButton.value).not.toBeNull()
    await client.elementIdClick(backButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const networkElement = await client.element('//FOOTER/DIV/DIV[2]')
    expect(networkElement).not.toBeNull()
    const networkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(networkName.value).toBe(targetNetowrkName.value)
  })

  app.test('delete network', async () => {
    const { client } = app.spectron

    await app.gotoSettingsView()
    await app.waitUntilLoaded()

    // Switch to network setting
    client.click('button[name=Network]')
    await app.waitUntilLoaded()

    // Get network name
    const labels = await app.elements('//MAIN//LABEL//SPAN')
    const networkNameElement = labels.value[3]
    expect(networkNameElement).not.toBeNull()
    const netowrkName = await client.elementIdText(networkNameElement.ELEMENT)
    console.log(`netowrkName = ${netowrkName.value}`);

    // Get network id
    const inputs = await app.elements("//MAIN//INPUT")
    const networkItemElement = inputs.value[1].ELEMENT
    expect(networkItemElement).not.toBeNull()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)

    // Delete network
    app.deleteNetwork(networkId)
    app.waitUntilLoaded()

    // Back
    const backButton = await client.element('//MAIN/DIV/DIV/DIV/BUTTON')
    expect(backButton.value).not.toBeNull()
    await client.elementIdClick(backButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const networkElement = await client.element('//FOOTER/DIV/DIV[2]')
    expect(networkElement).not.toBeNull()
    const newNetworkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(newNetworkName.value).not.toBe(netowrkName.value)
    console.log(`newNetworkName = ${newNetworkName.value}`);
  })
}
