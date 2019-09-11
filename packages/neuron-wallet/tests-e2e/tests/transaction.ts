import Application from '../application';
import { importWallet, sendTransaction } from '../operations'
import { TransactionTestEnv } from '../env'

// Start: Overview page
// End: Overview page
export default (app: Application, env: TransactionTestEnv) => {
  const password = 'Azusa2233'

  if (env.sendTo.length < 1 || env.mnemonic.length === 0) {
    console.log('Invalid parameter `env`');
    return
  }

  app.test('import wallet', async () => {

    const res = await app.spectron.electron.ipcRenderer.sendSync('E2E_ENV')
    console.log(`ENV.isTestMode = ${res}`);

    await app.clickMenu(['Wallet', 'Import Wallet', 'Import Mnemonic Seed'])
    await app.waitUntilLoaded()
    await importWallet(app, env.mnemonic, undefined, password)
  })

  app.test('check network state', async () => {
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
    console.log(`connected = ${connected}`);
    if (!connected) {
      throw 'Network disconnected'
    }
  })

  app.test('wail sync', async () => {
    const { client } = app.spectron
    while (true) {
      const syncElement = await app.element('//FOOTER/DIV/DIV[1]')
      expect(syncElement.value).not.toBeNull()
      const syncText = await client.elementIdText(syncElement.value.ELEMENT)
      if (syncText.value === 'Synced') {
        break
      } else {
        const progressElement = await app.element('//FOOTER/DIV/DIV[1]/DIV/DIV[1]/DIV/DIV[2]')
        if (progressElement.value) {
          const styleText = await client.elementIdAttribute(progressElement.value.ELEMENT, 'style')
          console.log(`sync progress [${styleText.value.slice(7, styleText.value.length - 1)}]`);
        }
        app.wait(2000)
      }
    }
    app.waitUntilLoaded()
  }, 1000 * 60 * 20)

  app.test('send transaction', async () => {
    await sendTransaction(app, password, env.sendTo)
  }, 1000 * 60 * 10)

  app.test('back to overview', async () => {
    const { client } = app.spectron
    // Switch to overview page
    const receiveButton = await app.getElementByTagName('button', 'Send')
    expect(receiveButton).not.toBeNull()
    await client.elementIdClick(receiveButton!.ELEMENT)
    await app.waitUntilLoaded()
  })
}
