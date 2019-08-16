import { Application as SpectronApplication} from 'spectron'
import path from 'path'
import { quitApp, getElementByTagName, editWallet, clickMenu } from './utils'
import { increaseRunningAppCount, decreaseRunningAppCount, exitServer } from './utils'

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
    const runningAppCount = await increaseRunningAppCount()
    console.log(`start ${runningAppCount} ${new Date().toTimeString()}`);
  }

  async stop() {
    if (!this.spectron.isRunning()) {
      console.log(`rrrrrrr so`);
      return
    }

    const runningAppCount = await decreaseRunningAppCount()
    if (runningAppCount > 0) {
      console.log(`quit ${runningAppCount} app`);
      quitApp(this.spectron.electron)
    } else {
      console.log(`quit ${runningAppCount} spectron`);
      await this.spectron.stop()
      await exitServer()
    }
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
