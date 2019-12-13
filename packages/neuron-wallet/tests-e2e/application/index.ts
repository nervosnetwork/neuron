import os from 'os';
import fs from 'fs';
import path from 'path';
import { Application as SpectronApplication } from 'spectron';
import { Element, RawResult } from 'webdriverio';
import { clickMenu, deleteNetwork, editNetwork, editWallet, sleep } from './utils';

export default class Application {
  spectron: SpectronApplication
  errorOccurred: boolean = false

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

  test(name: string, func: () => void, timeout: number = 2000 * 10 * 1) {
    it(name, async () => {
      if (this.errorOccurred) {
        return
      }

      try {
        this.waitUntilLoaded()
        await func()
      } catch (error) {
        this.errorOccurred = true

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

        throw error
      }
    }, timeout)
  }

  // wait
  async waitUntilLoaded(timeout?: number) {
    await this.spectron.client.waitUntilWindowLoaded(timeout)
  }

  async wait(delay: number) {
    await sleep(delay)
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

  // Element

  async element(selector: string, timeout: number = 300): Promise<RawResult<Element>> {
    await this.wait(timeout)
    const { client } = this.spectron
    let result: RawResult<Element> | undefined
    let error: Error | undefined
    try {
      result = await client.element(selector)
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

  async getElementByTagName(tagName: string, textContent: string): Promise<Element | null> {
    const { client } = this.spectron
    const elements = await this.elements(`<${tagName} />`)
    for (let index = 0; index < elements.value.length; index++) {
      const element = elements.value[index];
      const text = await client.elementIdText(element.ELEMENT)
      if (text.value === textContent) {
        return element
      }
    }
    return null
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

  // goto Setting page from menu according to platform
  async gotoSettingsView() {
    if (os.platform() === "darwin") {
      this.clickMenu(['Electron', 'Preferences...'])
    } else {
      this.clickMenu(['Help', 'Settings'])
    }
      await this.waitUntilLoaded()
  }
}
