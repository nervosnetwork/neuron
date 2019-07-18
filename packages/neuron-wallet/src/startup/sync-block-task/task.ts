import { remote } from 'electron'
import { Subject, Subscription } from 'rxjs'
import { initConnection as initAddressConnection } from '../../database/address/ormconfig'
import AddressService from '../../services/addresses'
import LockUtils from '../../models/lock-utils'
import AddressesUsedSubject from '../../models/subjects/addresses-used-subject'
import BlockListener from '../../services/sync/block-listener'
import { NetworkWithID } from '../../services/networks'
import { initDatabase } from './init-database'
import { register as registerTxStatusListener } from '../../listener/tx-status'
import BlockNumber from '../../services/sync/block-number'
import Utils from '../../services/sync/utils'

const { onCloseEvent } = remote.require('./startup/sync-block-task/create')
const currentWindow = remote.getCurrentWindow()

const closeListener = (listener: Subscription) => {
  onCloseEvent(currentWindow, listener)
}

const {
  nodeService,
  addressDbChangedSubject,
  addressesUsedSubject,
  databaseInitSubject,
  walletCreatedSubject,
} = remote.require('./startup/sync-block-task/params')

// pass to task a main process subject
AddressesUsedSubject.setSubject(addressesUsedSubject)

export const stopLoopSubject = new Subject()

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (): Promise<string[]> => {
  const addresses: string[] = (await AddressService.allAddresses()).map(addr => addr.address)
  const lockHashes: string[] = await Promise.all(
    addresses.map(async addr => {
      return LockUtils.addressToLockHash(addr)
    })
  )
  return lockHashes
}

// call this after network switched
// TODO: listen to network switch
export const switchNetwork = async () => {
  // stop all blocks service
  stopLoopSubject.next('stop')
  // disconnect old connection and connect to new database
  await initDatabase()
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert()
  // start sync blocks service
  let blockListener = new BlockListener(lockHashes, nodeService.tipNumberSubject)

  const addressDBChangedListener = addressDbChangedSubject.subscribe(async (event: string) => {
    // ignore update and remove
    if (event === 'AfterInsert') {
      const hashes: string[] = await loadAddressesAndConvert()
      blockListener.setLockHashes(hashes)
    }
  })

  closeListener(addressDBChangedListener)

  const regenerateListener = async () => {
    const blockNumber = new BlockNumber()
    await blockNumber.updateCurrent(BigInt(0))
    const hashes: string[] = await loadAddressesAndConvert()
    blockListener = new BlockListener(hashes, nodeService.tipNumberSubject)
    await blockListener.start()
  }

  const walletCreatedListener = walletCreatedSubject.subscribe(async (type: string) => {
    if (type === 'import') {
      await blockListener.stop()
      // wait former queue to be drained
      await Utils.sleep(3000)
      await regenerateListener()
    }
  })

  closeListener(walletCreatedListener)

  stopLoopSubject.subscribe(() => {
    blockListener.stop()
  })

  blockListener.start()
}

export const run = async () => {
  await initAddressConnection()
  const dbInitListener = databaseInitSubject.subscribe(async (network: NetworkWithID | undefined) => {
    if (network) {
      await switchNetwork()
    }
  })
  closeListener(dbInitListener)
  registerTxStatusListener()
}

run()

export default run
