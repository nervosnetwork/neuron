import Application from '../application'

export const checkNetworkStatus = async (app: Application) => {
  const { client } = app.spectron
  let retryCount = 5
  let connected = false
  while (!connected && retryCount > 0) {
    retryCount -= 1
    const networkStateElement = await app.element('//FOOTER/DIV/DIV[2]//I')
    expect(networkStateElement.value).not.toBeNull()
    const state = await client.elementIdAttribute(networkStateElement.value.ELEMENT, 'data-icon-name')
    console.log(`network state ${state.value}`);
    if (state.value === 'Disconnected') {
      connected = false
      app.wait(1000)
    } else if (state.value === 'Connected') {
      connected = true
      break
    }
  }
  return connected
}
