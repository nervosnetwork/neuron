import { remote } from 'electron'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import IndexerQueue from 'services/indexer/queue'

import { initDatabase } from './init-database'

const { addressDbChangedSubject } = remote.require('./startup/sync-block-task/params')

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (): Promise<string[]> => {
  const addresses: string[] = (await AddressService.allAddresses()).map(addr => addr.address)
  const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(addresses)
  return lockHashes
}

// call this after network switched
let indexerQueue: IndexerQueue | undefined
export const switchNetwork = async (nodeURL: string) => {
  // stop all blocks service
  if (indexerQueue) {
    await indexerQueue.stopAndWait()
  }

  // disconnect old connection and connect to new database
  await initDatabase()
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert()
  // start sync blocks service
  indexerQueue = new IndexerQueue(nodeURL, lockHashes)

  addressDbChangedSubject.subscribe(async (event: string) => {
    // ignore update and remove
    if (event === 'AfterInsert') {
      const hashes: string[] = await loadAddressesAndConvert()
      if (indexerQueue) {
        indexerQueue.setLockHashes(hashes)
      }
    }
  })

  indexerQueue.start()
}
