import Application from './application'
import { createWallet } from './operations'

describe('wallet tests', () => {
  let app: Application

  beforeAll(() => {
    app = new Application()
    return app.start()
  })

  afterAll(() => {
    return app.stop()
  })

  it('create wallet', async () => {
    const { client } = app.spectron
    await app.waitUntilLoaded()

    // Click create wallet button
    const createWalletButton = await app.getElementByTagName('button', 'Create a Wallet')
    expect(createWalletButton).not.toBeNull()
    await client.elementIdClick(createWalletButton!.ELEMENT)

    await createWallet(app)
  })

  it('add network', async () => {
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
    const addNetworkButton = await client.element('//MAIN/DIV/DIV[3]/DIV[2]/BUTTON')
    expect(addNetworkButton.value).not.toBeNull()
    await client.elementIdClick(addNetworkButton.value.ELEMENT)
    await app.waitUntilLoaded()
    
    // Setup Network
    const inputElements = await client.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(2)
    await client.elementIdValue(inputElements.value[0].ELEMENT, newNodeRpcUrl)
    await client.elementIdValue(inputElements.value[1].ELEMENT, newNodeName)
    await app.waitUntilLoaded()
    // Save
    const saveButton = await app.getElementByTagName('button', 'Save')
    expect(saveButton).not.toBeNull()
    await client.elementIdClick(saveButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const newNetworkItemElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV')
    expect(newNetworkItemElement).not.toBeNull()
    const netowrkItemTitle = await client.elementIdAttribute(newNetworkItemElement.value.ELEMENT, 'title')
    expect(netowrkItemTitle.value).toBe(`${newNodeName}: ${newNodeRpcUrl}`)
    console.log(`netowrkItemTitle - ${netowrkItemTitle.value}`);
  })

  it('edit network', async () => {
    
  })


  it('switch network', async () => {
    const { client } = app.spectron

    // Get target network name
    const targetNetworkNameElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]/DIV/LABEL/DIV/SPAN')
    expect(targetNetworkNameElement).not.toBeNull()
    const targetNetowrkName = await client.elementIdText(targetNetworkNameElement.value.ELEMENT)
    console.log(`targetNetowrkName = ${targetNetowrkName.value}`);

    // switch network
    const targetNetworkElement = await client.element('//MAIN/DIV/DIV[3]/DIV/DIV/DIV/DIV/DIV[3]')
    expect(targetNetworkElement.value).not.toBeNull()
    await client.elementIdClick(targetNetworkElement.value.ELEMENT)
    await app.waitUntilLoaded()

    // back
    const backButton = await client.element('//MAIN/DIV/DIV/DIV/BUTTON')
    expect(backButton.value).not.toBeNull()
    await client.elementIdClick(backButton.value.ELEMENT)
    await app.waitUntilLoaded()

    // Check network name
    const networkElement = await client.element('//FOOTER/DIV/DIV[2]')
    expect(targetNetworkNameElement).not.toBeNull()
    const networkName = await client.elementIdText(networkElement.value.ELEMENT)
    expect(networkName.value).toBe(targetNetowrkName.value)
    console.log(`networkName = ${networkName.value}`);
    
  })

  

})
