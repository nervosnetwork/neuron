import { Application as SpectronApplication} from 'spectron'
import path from 'path'
import { quitApp, getElementByTagName, editWallet, clickMenu } from './utils'

let runningAppCount = 0

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
        '--lang=en'
      ], 
      path: electronPath 
    })
  }

  async waitUntilLoaded() {
    await this.spectron.client.pause(200)
    await this.spectron.client.waitUntilWindowLoaded()
  }

  async start() {
    if (this.spectron.isRunning()) {
      console.log(`rrrrrrr sa`);
      
      return
    }
    await this.spectron.start()
    await this.spectron.client.waitUntilWindowLoaded(10000)
    runningAppCount += 1
    console.log(`start ${new Date().toTimeString()}`);
  }

  async stop() {
    if (!this.spectron.isRunning()) {
      console.log(`rrrrrrr so`);
      return
    }
    if (runningAppCount > 1) {
      console.log(`quit app`);
      quitApp(this.spectron.electron)
    } else {
      console.log(`quit spectron`);
      await this.spectron.stop()
    }
    runningAppCount -= 1
  }

  // utils

  getElementByTagName(tagName: string, textContent: string) {
    return getElementByTagName(this.spectron.client, tagName, textContent)
  }

  editWallet(walletId: string) {
    return editWallet(this.spectron.electron, walletId)
  }

  clickMenu(labels: string[]) {
    return clickMenu(this.spectron.electron, labels)
  }
}
