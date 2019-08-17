import { Application as SpectronApplication } from 'spectron'
import path from 'path'
import { clickMenu, editNetwork, editWallet, deleteNetwork, quitApp, sleep } from './utils';
import { increaseRunningAppCount, decreaseRunningAppCount, exitServer, fetchRunningAppCount } from './utils'
import fs from 'fs'
import { RawResult, Element } from 'webdriverio'
import { ELEMENT_QUERY_DEFAULT_RETRY_COUNT, ELEMENT_QUERY_RETRY_WAITING_TIME } from './const'

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
        '--lang=en'
      ], 
      path: electronPath,
      webdriverOptions: {
        // headless: true,
        // logLevel: 'trace'
      }
    })
  }

  async waitUntilLoaded() {
    // await this.spectron.client.pause(400)
    sleep(400)
    await this.spectron.client.waitUntilWindowLoaded()
  }

  async start() {
    if (this.spectron.isRunning()) {
      return
    }
    await this.spectron.start()
    await this.spectron.client.waitUntilWindowLoaded(10000)
    const runningAppCount = await increaseRunningAppCount()
    console.log(`start ${runningAppCount} ${new Date().toTimeString()}`);
  }

  // Start multiple test applications at the same time, calling `spectron.stop()` will stop `ChromeDriver` when the first application finishes executing.
  // Other test applications will get an error `Error: connect ECONNREFUSED 127.0.0.1:9515`.
  // So need to close `spectron` after the last test.
  // Similar issue: https://github.com/electron-userland/spectron/issues/356
  async stop() {
    if (!this.spectron.isRunning()) {
      return
    }
    console.log(`will stop ${new Date().toTimeString()}`);
    let runningAppCount = await decreaseRunningAppCount()

    // sync exit
    while (runningAppCount !== 0) {
      sleep(1000)
      runningAppCount = await fetchRunningAppCount()
    }

    if (runningAppCount > 0) {
      console.log(`quit ${runningAppCount} app ${new Date().toTimeString()}`);
      quitApp(this.spectron.electron)
    } else {
      console.log(`quit ${runningAppCount} spectron ${new Date().toTimeString()}`);
      await exitServer()
      await this.spectron.stop()
    }
    console.log(`did stop ${new Date().toTimeString()}`);
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

  test(name: string, func: () => void) {
    it(name, async () => {
      if (this.errorOccurred) {
        console.log(`skip - [${name}] ${new Date().toTimeString()}`);
        return
      }

      try {
        console.log(`will test [${name}] ${new Date().toTimeString()}`);
        await func()
        console.log(`did test [${name}] ${new Date().toTimeString()}`);
      } catch (error) {
        this.errorOccurred = true
        // console.log(`error: ${new Date().toTimeString()}\n${error}\n${error.stack}`);
        console.log(`error: ${name} ${new Date().toTimeString()}\n${error}`);
        
        // print main text
        const { client, browserWindow } = this.spectron
        const mainElement = await client.element('//MAIN')
        if (mainElement.value) {
          const mainText = await client.elementIdText(mainElement.value.ELEMENT)
          console.log(`mainText: [\n${mainText.value}\n]`);
        }

        // create dir
        try {
          await fs.mkdirSync(path.join(__dirname, '../errors'))
        } catch {
        }
        const errorFileName = `${name.replace(/ /g, '_')}-${new Date().getTime()}`
        // save error log
        await fs.writeFileSync(path.join(__dirname, '../errors', `${errorFileName}.txt`), error.stack)

        // save screenshot
        const imageBuffer = await browserWindow.capturePage()
        await fs.writeFileSync(path.join(__dirname, '../errors', `${errorFileName}.png`), imageBuffer)

        console.log(`did save error log ${new Date().toTimeString()}\n${error}\n${error.stack}`);

        throw error
      }
    }, 1000 * 60 * 1)
  }

  // Element

  async element(selector: string, retryCount: number = ELEMENT_QUERY_DEFAULT_RETRY_COUNT): Promise<RawResult<Element>> {
    const { client } = this.spectron
    let result: RawResult<Element> | undefined
    let error: Error | undefined
    try {
      result = await client.element(selector)
    } catch (_error) {
      error = _error
    }
    
    if ((error || (result && !result.value)) && retryCount > 0) {
      console.log(`${selector} - The query failed, wait 1 second and try again. ${new Date().toTimeString()}`);
      sleep(ELEMENT_QUERY_RETRY_WAITING_TIME)
      return this.element(selector, retryCount - 1)
    } else {
      return new Promise((resolve, reject) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    }
  }

  async elements(selector: string, retryCount: number = ELEMENT_QUERY_DEFAULT_RETRY_COUNT): Promise<RawResult<Element[]>> {
    const { client } = this.spectron
    let result: RawResult<Element[]> | undefined
    let error: Error | undefined
    try {
      result = await client.elements(selector)
    } catch (_error) {
      error = _error
    }
    
    if ((error || (result && !result.value)) && retryCount > 0) {
      console.log(`${selector} - The query failed, wait 1 second and try again. ${new Date().toTimeString()}`);
      sleep(ELEMENT_QUERY_RETRY_WAITING_TIME)
      return this.elements(selector, retryCount - 1)
    } else {
      return new Promise((resolve, reject) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    }
  }

  async getElementByTagName(tagName: string, textContent: string, retryCount: number = ELEMENT_QUERY_DEFAULT_RETRY_COUNT): Promise<Element | null> {
    const { client } = this.spectron
    const elements = await this.elements(`<${tagName} />`)        
    for (let index = 0; index < elements.value.length; index++) {
      const element = elements.value[index];
      const text = await client.elementIdText(element.ELEMENT)
      if (text.value === textContent) {
        return element
      }
    }
    if (retryCount > 0) {
      console.log(`${tagName}-${textContent} - The query failed, wait 1 second and try again. ${new Date().toTimeString()}`);
      sleep(ELEMENT_QUERY_RETRY_WAITING_TIME)
      return this.getElementByTagName(tagName, textContent, retryCount - 1)
    } else {
      return null
    }
  }

  async setValue(selector: string, text: string) {
    const { client } = this.spectron
    const result = await client.selectorExecute(selector, (elements: any, args) => {
      const element = elements[0]  
      var event = new Event('input', { bubbles: true}) as any;
      event.simulated = true;
      element.value = args;
      element.dispatchEvent(event);
      return `${element} ${args}`
    }, text)
    console.log(`setValue = ${result}`);
  }
}
