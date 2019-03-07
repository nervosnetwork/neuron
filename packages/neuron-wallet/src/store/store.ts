import Store from 'electron-store'
import env from '../env'

const encryptKey = 'Neuron'

interface Options {
  name?: string
  cwd?: string
  encryptionKey?: string | Buffer
}

export default class BaseStore {
  store: Store

  constructor(options: Options) {
    const myOptions = options
    if (!env.isDevMode) {
      myOptions.encryptionKey = encryptKey
    }
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
