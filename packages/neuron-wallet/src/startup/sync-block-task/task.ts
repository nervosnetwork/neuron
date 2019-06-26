import { remote } from 'electron'
import { Subject } from 'rxjs'
import { initConnection as initAddressConnection } from '../../database/address/ormconfig'
import AddressService from '../../services/addresses'
import LockUtils from '../../utils/lock-utils'
import AddressesUsedSubject from '../../models/subjects/addresses-used-subject'
import BlockListener from '../../services/sync/block-listener'
import { NetworkWithID } from '../../services/networks'
import { initDatabase } from './init-database'

const { nodeService, addressChangeSubject, addressesUsedSubject, databaseInitSubject } = remote.require(
  './startup/sync-block-task/params'
)

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
  const blockListener = new BlockListener(lockHashes, nodeService.tipNumberSubject)

  addressChangeSubject.subscribe(async () => {
    const hashes: string[] = await loadAddressesAndConvert()
    blockListener.setLockHashes(hashes)
  })

  stopLoopSubject.subscribe(() => {
    blockListener.stop()
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
}

run()

export default run
