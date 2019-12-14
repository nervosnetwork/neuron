import fs from 'fs';
import path from 'path';
import { Application as SpectronApplication } from 'spectron';
import { Element, RawResult } from 'webdriverio';
import { clickMenu, deleteNetwork, editNetwork, editWallet } from './utils';
import { createWallet } from '../operations/create-wallet'

export default class Application {
  spectron: SpectronApplication

  constructor() {
    let electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }
    this.spectron = new SpectronApplication({
      args: [
        '--require',
        path.join(__dirname, 'preload.js'),
        path.join(__dirname, '../..', 'dist', 'main.js'),
        '--lang=en',
      ],
      path: electronPath,
      env: {
        // NODE_ENV: 'test'
      },
    })
  }

  async start() {
    if (this.spectron.isRunning()) {
      return
    }
    await this.spectron.start()
    await this.spectron.client.waitUntilWindowLoaded(10000)
  }

  async stop() {
    if (!this.spectron.isRunning()) {
      return
    }
    await this.spectron.stop()
  }

  async createWalletFromWizard() {
    this.spectron.client.click('button[name=create-a-wallet]')
    await this.spectron.client.waitUntilWindowLoaded()
    await createWallet(this)
    await this.spectron.client.waitUntilWindowLoaded()
  }

  async createWalletFromSettings() {
    await this.gotoSettingsView()
    await this.spectron.client.waitUntilWindowLoaded()
    this.spectron.client.click('button[name=Wallets]')
    await this.spectron.client.waitUntilWindowLoaded()
    this.spectron.client.click('button[name=create-a-wallet]')
    await this.spectron.client.waitUntilWindowLoaded()
    await createWallet(this)
    await this.spectron.client.waitUntilWindowLoaded()
  }

  test(name: string, func: () => void, timeout: number = 2000 * 10 * 1) {
    it(name, async () => {
      try {
        await func()
      } catch (error) {
        const errorsPath = path.join(__dirname, '../errors')
        if (!fs.existsSync(errorsPath)) {
          fs.mkdirSync(errorsPath)
        }
        const errorFileName = `${name.replace(/ /g, '_')}-${new Date().getTime()}`

        // save error log
        fs.writeFileSync(path.join(errorsPath, `${errorFileName}.txt`), error.stack)

        // save screenshot
        const imageBuffer = await this.spectron.browserWindow.capturePage()
        fs.writeFileSync(path.join(errorsPath, `${errorFileName}.png`), imageBuffer)
      }
    }, timeout)
  }

  // ipc

  editWallet(walletId: string) {
    return editWallet(this.spectron.electron, walletId)
  }

  clickMenu(labels: string[]) {
    return clickMenu(this.spectron.electron, labels)
  }

  editNetwork(networkId: string) {
    return editNetwork(this.spectron.electron, networkId)
  }

  deleteNetwork(networkId: string) {
    return deleteNetwork(this.spectron.electron, networkId)
  }


  async elements(selector: string): Promise<RawResult<Element[]>> {
    const { client } = this.spectron
    let result: RawResult<Element[]> | undefined
    let error: Error | undefined
    try {
      result = await client.elements(selector)
    } catch (_error) {
      error = _error
    }

    return new Promise((resolve, reject) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  }

  async setElementValue(selector: string, text: string) {
    const { client } = this.spectron
    await client.selectorExecute(selector, (elements: any, args) => {
      const element = elements[0]
      var event = new Event('input', { bubbles: true}) as any;
      event.simulated = true;
      element.value = args;
      element.dispatchEvent(event);
      return `${element} ${args}`
    }, text)
  }

  async gotoSettingsView() {
    this.spectron.client.click('button[name=Settings]')
  }
}
