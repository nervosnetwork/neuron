import fs from 'fs';
import path from 'path';
import { Application as SpectronApplication } from 'spectron';
import { Element, RawResult } from 'webdriverio';
import { debuglog } from 'util'
import { clickMenu, deleteNetwork, editNetwork, editWallet, sleep } from './utils';

const log = debuglog(__filename)

export default class Application {
  spectron: SpectronApplication
  errorOccurred: boolean = false
  osPlatform = this.getOSplatform()

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
    log(`start ${new Date().toTimeString()}`);
  }

  async stop() {
    if (!this.spectron.isRunning()) {
      return
    }
    log(`stop ${new Date().toTimeString()}`);
    await this.spectron.stop()
  }

  test(name: string, func: () => void, timeout: number = 1000 * 60 * 1) {
    it(name, async () => {
      if (this.errorOccurred) {
        log(`skip - [${name}] ${new Date().toTimeString()}`);
        return
      }

      try {
        log(`will test [${name}] ${new Date().toTimeString()}`);
        this.waitUntilLoaded()
        await func()
        log(`did test [${name}] ${new Date().toTimeString()}`);
      } catch (error) {
        this.errorOccurred = true
        log(`error: ${name} ${new Date().toTimeString()}\n${error}`);

        // print main text
        const { client, browserWindow } = this.spectron
        const mainElement = await client.element('//MAIN')
        if (mainElement.value) {
          const mainText = await client.elementIdText(mainElement.value.ELEMENT)
          log(`mainText: [\n${mainText.value}\n]`);
        }

        // create dir

        const errorsPath = path.join(__dirname, '../errors')
        if(!fs.existsSync(errorsPath)) {
          await fs.mkdirSync(errorsPath)
        }
        const errorFileName = `${name.replace(/ /g, '_')}-${new Date().getTime()}`
        // save error log
        await fs.writeFileSync(path.join(__dirname, '../errors', `${errorFileName}.txt`), error.stack)

        // save screenshot
        const imageBuffer = await browserWindow.capturePage()
        await fs.writeFileSync(path.join(__dirname, '../errors', `${errorFileName}.png`), imageBuffer)

        log(`did save error log ${new Date().toTimeString()}\n${error}\n${error.stack}`);

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

  getOSplatform():string {
    let os = require('os');
    let platform = os.platform();
    return platform;
  }

  // goto Setting page from menu according to OS platform
  async gotoSettingPageFromMenu() {
    if (this.osPlatform.includes("darwin")) {
      await this.clickMenu(['Electron', 'Preferences...'])
    } else {
      await this.clickMenu(['Help', 'Settings'])
    }
  }
}
