import { remote } from 'electron'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import IndexerQueue, { LockHashInfo } from 'services/indexer/queue'
import { Address } from 'database/address/address-dao'

import initConnection from 'database/chain/ormconfig'
import DaoUtils from 'models/dao-utils'

const { nodeService, addressCreatedSubject, walletCreatedSubject } = remote.require('./startup/sync-block-task/params')

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (nodeURL: string): Promise<string[]> => {
  const addresses: string[] = AddressService.allAddresses().map(addr => addr.address)
  const lockUtils = new LockUtils(await LockUtils.loadSystemScript(nodeURL))
  return lockUtils.addressesToAllLockHashes(addresses)
}

// call this after network switched
let indexerQueue: IndexerQueue | undefined
export const switchNetwork = async (nodeURL: string, genesisBlockHash: string, _chain: string) => {
  // stop all blocks service
  if (indexerQueue) {
    await indexerQueue.stopAndWait()
  }

  // clean LockUtils info and DaoUtils info
  LockUtils.cleanInfoWhenSwitchNetwork()
  DaoUtils.cleanInfoWhenSwitchNetwork()

  // disconnect old connection and connect to new database
  await initConnection(genesisBlockHash)
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert(nodeURL)
  const lockHashInfos: LockHashInfo[] = lockHashes.map(lockHash => {
    return {
      lockHash,
      isImporting: true,
    }
  })
  // start sync blocks service
  indexerQueue = new IndexerQueue(nodeURL, lockHashInfos, nodeService.tipNumberSubject)

  // listen to address created
  addressCreatedSubject.subscribe(async (addresses: Address[]) => {
    if (indexerQueue) {
      let lockUtils = new LockUtils(await LockUtils.loadSystemScript(nodeURL))
      const infos: LockHashInfo[] = addresses.map(addr => {
        const hashes: string[] = lockUtils.addressToAllLockHashes(addr.address)
        // undefined means true
        const isImporting: boolean = addr.isImporting !== false
        return hashes.map(h => {
          return {
            lockHash: h,
            isImporting,
          }
        })
      }).reduce((acc, val) => acc.concat(val), [])
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
