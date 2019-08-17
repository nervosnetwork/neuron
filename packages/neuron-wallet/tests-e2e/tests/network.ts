import Application from '../application';

// Start: Overview page
// End: Overview page
export default (app: Application) => {
  app.test('add network', async () => {
    const { client } = app.spectron
    const newNodeName = 'Node-2233'
    const newNodeRpcUrl = 'http://localhost:8114'

    // Go to setting page
    await app.clickMenu(['Electron', 'Preferences...'])
    await app.waitUntilLoaded()

    // Switch to network setting
    const networkSettingButton = await app.getElementByTagName('button', 'Network')
    expect(networkSettingButton).not.toBeNull()
    await client.elementIdClick(networkSettingButton!.ELEMENT)
    await app.waitUntilLoaded()
    
    // Click Add-Network
    const addNetworkButton = await app.element('//MAIN/DIV/DIV[3]/DIV[2]/BUTTON')
    expect(addNetworkButton.value).not.toBeNull()
    await client.elementIdClick(addNetworkButton.value.ELEMENT)
    await app.waitUntilLoaded()
    
    // Setup Network
    const inputElements = await app.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(2)
    // await client.elementIdValue(inputElements.value[0].ELEMENT, newNodeRpcUrl)
    // await client.elementIdValue(inputElements.value[1].ELEMENT, newNodeName)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[1]//INPUT', newNodeRpcUrl)
    await app.setElementValue('//MAIN/DIV/DIV/DIV[2]//INPUT', newNodeName)
    await app.waitUntilLoaded()
    // Save
    const saveButton = await app.getElementByTagName('button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const newNetworkItemElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV')
    expect(newNetworkItemElement).not.toBeNull()
    const netowrkItemTitle = await client.elementIdAttribute(newNetworkItemElement.value.ELEMENT, 'title')
    expect(netowrkItemTitle.value).toBe(`${newNodeName}: ${newNodeRpcUrl}`)
    console.log(`netowrkItemTitle - ${netowrkItemTitle.value}`);
  })

  app.test('edit network', async () => {
    const { client } = app.spectron

    // Get network id
    const networkItemElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/INPUT')
    expect(networkItemElement.value).not.toBeNull()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement.value.ELEMENT, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement.value.ELEMENT, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)
    console.log(`networkId = ${networkId}`);
    
    // Go to edit network page
    await app.editNetwork(networkId)
    await app.waitUntilLoaded()

    // Setup Network
    const inputElements = await app.elements('<input />')
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
    const saveButton = await app.getElementByTagName('button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const newNetworkItemElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV')
    expect(newNetworkItemElement).not.toBeNull()
    const netowrkItemTitle = await client.elementIdAttribute(newNetworkItemElement.value.ELEMENT, 'title')
    expect(netowrkItemTitle.value).toBe(`${newName}: ${newRpcUrl}`)
    console.log(`netowrkItemTitle - ${netowrkItemTitle.value}`);
  })

  app.test('switch network', async () => {
    const { client } = app.spectron

    // Get target network name
    const targetNetworkNameElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV/SPAN')
    expect(targetNetworkNameElement).not.toBeNull()
    const targetNetowrkName = await client.elementIdText(targetNetworkNameElement.value.ELEMENT)
    console.log(`targetNetowrkName = ${targetNetowrkName.value}`);

    // switch network
    const targetNetworkElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]')
    expect(targetNetworkElement.value).not.toBeNull()
    await client.elementIdClick(targetNetworkElement.value.ELEMENT)
    await app.waitUntilLoaded()

    // back
    const backButton = await app.element('//MAIN/DIV/DIV/DIV/BUTTON')
    expect(backButton.value).not.toBeNull()
    await client.elementIdClick(backButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const networkElement = await app.element('//FOOTER/DIV/DIV[2]')
    expect(networkElement).not.toBeNull()
    const networkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(networkName.value).toBe(targetNetowrkName.value)
    console.log(`networkName = ${networkName.value}`);
  })

  app.test('delete network', async () => {
    const { client } = app.spectron

    // Go to setting page
    await app.clickMenu(['Electron', 'Preferences...'])
    await app.waitUntilLoaded()

    // Switch to network setting
    const networkSettingButton = await app.getElementByTagName('button', 'Network')
    expect(networkSettingButton).not.toBeNull()
    await client.elementIdClick(networkSettingButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Get network name
    const networkNameElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV/SPAN')
    expect(networkNameElement).not.toBeNull()
    const netowrkName = await client.elementIdText(networkNameElement.value.ELEMENT)
    console.log(`netowrkName = ${netowrkName.value}`);

    // Get network id
    const networkItemElement = await app.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/INPUT')
    expect(networkItemElement.value).not.toBeNull()
    const networkItemElementId = await client.elementIdAttribute(networkItemElement.value.ELEMENT, 'id')
    const networkItemElementName = await client.elementIdAttribute(networkItemElement.value.ELEMENT, 'name')
    const networkId = networkItemElementId.value.slice(networkItemElementName.value.length + 1)
    console.log(`networkId = ${networkId}`);

    // Delete network
    app.deleteNetwork(networkId)
    app.waitUntilLoaded()

    // Back
    const backButton = await app.element('//MAIN/DIV/DIV/DIV/BUTTON')
    expect(backButton.value).not.toBeNull()
    await client.elementIdClick(backButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const networkElement = await app.element('//FOOTER/DIV/DIV[2]')
    expect(networkElement).not.toBeNull()
    const newNetworkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(newNetworkName.value).not.toBe(netowrkName.value)
    console.log(`newNetworkName = ${newNetworkName.value}`);
  })
}
