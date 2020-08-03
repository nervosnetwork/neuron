import { EventEmitter } from 'events'

export const flushPromises = () => {
  jest.runAllImmediates()
  return new Promise(setImmediate)
};


export class SyncTask extends EventEmitter {
  public mount() {

  }

  public unmount() {

  }

  public start() {

  }

  public queryIndexer() {

  }
}
