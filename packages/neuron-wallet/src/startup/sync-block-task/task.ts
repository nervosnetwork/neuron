import { remote } from 'electron'
import { initConnection as initAddressConnection } from 'database/address/ormconfig'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import BlockListener from 'services/sync/block-listener'
import { NetworkWithID } from 'services/networks'
import { register as registerTxStatusListener } from 'listeners/tx-status'
import { register as registerAddressListener } from 'listeners/address'

import { initDatabase } from './init-database'

// register to listen address updates
registerAddressListener()

const {
  nodeService,
  addressDbChangedSubject,
  addressesUsedSubject,
  databaseInitSubject,
  walletCreatedSubject,
} = remote.require('./startup/sync-block-task/params')

// pass to task a main process subject
AddressesUsedSubject.setSubject(addressesUsedSubject)

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

  addressDbChangedSubject.subscribe(async (event: string) => {
    // ignore update and remove
    if (event === 'AfterInsert') {
      const hashes: string[] = await loadAddressesAndConvert()
      if (blockListener) {
        blockListener.setLockHashes(hashes)
      }
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

export const run = async () => {
  await initAddressConnection()
  databaseInitSubject.subscribe(async (network: NetworkWithID | undefined) => {
    if (network) {
      await switchNetwork()
    }
  })
  registerTxStatusListener()
}

run()

export default run
