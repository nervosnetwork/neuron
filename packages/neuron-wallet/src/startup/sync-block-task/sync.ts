import { remote } from 'electron'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import BlockListener from 'services/sync/block-listener'
import { Address } from 'database/address/dao'

import { initDatabase } from './init-database'

const { nodeService, addressCreatedSubject, walletCreatedSubject } = remote.require('./startup/sync-block-task/params')

export interface LockHashInfo {
  lockHash: string
  isImporting: boolean | undefined
}

// pass to task a main process subject
// AddressesUsedSubject.setSubject(addressesUsedSubject)

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (): Promise<string[]> => {
  const addresses: string[] = (await AddressService.allAddresses()).map(addr => addr.address)
  const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(addresses)
  return lockHashes
}

// call this after network switched
let blockListener: BlockListener | undefined
export const switchNetwork = async () => {
  // stop all blocks service
  if (blockListener) {
    await blockListener.stopAndWait()
  }

  // disconnect old connection and connect to new database
  await initDatabase()
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert()
  // start sync blocks service
  blockListener = new BlockListener(lockHashes, nodeService.tipNumberSubject)

  // listen to address created
  addressCreatedSubject.subscribe(async (addresses: Address[]) => {
    if (blockListener) {
      const infos: LockHashInfo[] = (await Promise.all(
        addresses.map(async addr => {
          const hashes: string[] = await LockUtils.addressToAllLockHashes(addr.address)
          // undefined means false
          const isImporting: boolean = addr.isImporting === true
          return hashes.map(h => {
            return {
              lockHash: h,
              isImporting,
            }
          })
        })
      )).reduce((acc, val) => acc.concat(val), [])
      const oldLockHashes: string[] = blockListener.getLockHashes()
      const anyIsImporting: boolean = infos.some(info => info.isImporting === true)
      if (oldLockHashes.length === 0 && !anyIsImporting) {
        await blockListener.setToTip()
      }
      blockListener.appendLockHashes(infos.map(info => info.lockHash))
    }
  })

  const regenerateListener = async () => {
    if (blockListener) {
      await blockListener.stopAndWait()
    }
    // wait former queue to be drained
    const hashes: string[] = await loadAddressesAndConvert()
    blockListener = new BlockListener(hashes, nodeService.tipNumberSubject)
    await blockListener.start(true)
  }

  walletCreatedSubject.subscribe(async (type: string) => {
    if (type === 'import') {
      await regenerateListener()
    }
  })

  blockListener.start()
}
