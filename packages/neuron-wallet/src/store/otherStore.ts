/*
 * @Author: BaojunCZ
 * @LastEditors: your name
 * @Description: other store
 * @Date: 2019-03-05 19:50:40
 * @LastEditTime: 2019-03-06 12:32:04
 */
import BaseStore from './store'

const otherDataName = 'NeuronOtherDB'

export default class OtherStore extends BaseStore {
  constructor() {
    super({
      name: otherDataName,
    })
  }

  get(key: string) {
    this.has(key)
    return this.store.get(key)
  }

  save(key: string, data: any) {
    this.store.set(key, data)
  }

  delete(key: string) {
    this.has(key)
    this.store.delete(key)
  }
}
