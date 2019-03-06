/*
 * @Author: BaojunCZ
 * @LastEditors: your name
 * @Description: store base
 * @Date: 2019-03-05 19:50:40
 * @LastEditTime: 2019-03-06 12:31:34
 */
import Store from 'electron-store'

// const encryptKey = 'Neuron'

interface Options {
  name?: string
  cwd?: string
  encryptionKey?: string | Buffer
}

export default class BaseStore {
  store: Store

  constructor(options: Options) {
    const myOptions = options
    // myOptions.encryptionKey = encryptKey
    this.store = new Store(myOptions)
  }

  protected has(key: string) {
    return this.store.has(key)
  }

  protected get(key: string, defaultValue?: any) {
    return this.store.get(key, defaultValue)
  }

  protected save(key: string, data: any) {
    this.store.set(key, data)
  }

  protected delete(key: string) {
    if (this.has(key)) {
      this.store.delete(key)
    }
  }
}
