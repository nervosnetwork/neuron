import { remote } from 'electron'
import AddressService, { AddressWithWay } from 'services/addresses'
import LockUtils from 'models/lock-utils'
import IndexerQueue, { LockHashInfo } from 'services/indexer/queue'
// import { Address } from 'database/address/dao'

import { initDatabase } from './init-database'

const { nodeService, addressCreatedSubject, walletCreatedSubject } = remote.require('./startup/sync-block-task/params')

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
  const lockHashInfos: LockHashInfo[] = lockHashes.map(lockHash => {
    return {
      lockHash,
      isImporting: true,
    }
  })
  // start sync blocks service
  indexerQueue = new IndexerQueue(nodeURL, lockHashInfos, nodeService.tipNumberSubject)

  // listen to address created
  addressCreatedSubject.subscribe(async (addressWithWay: AddressWithWay[]) => {
    if (indexerQueue) {
      const infos: LockHashInfo[] = (await Promise.all(
        addressWithWay.map(async aw => {
          const hashes: string[] = await LockUtils.addressToAllLockHashes(aw.address.address)
          // undefined means true
          const isImporting: boolean = aw.isImporting !== false
          return hashes.map(h => {
            return {
              lockHash: h,
              isImporting,
            }
          })
        })
      )).reduce((acc, val) => acc.concat(val), [])
      indexerQueue.appendLockHashInfos(infos)
    }
  })

  walletCreatedSubject.subscribe(async (type: string) => {
    if (type === 'import') {
      if (indexerQueue) {
        indexerQueue.reset()
      }
    }
  })

  indexerQueue.start()
  indexerQueue.processFork()
}
