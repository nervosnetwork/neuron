import { remote } from 'electron'
import { Subject } from 'rxjs'
import initConnection from '../../typeorm'
import Address from '../../services/addresses'
import LockUtils from '../../utils/lock-utils'
import AddressesUsedSubject from '../../subjects/addresses-used-subject'
import BlockListener from '../../services/sync/block-listener'
import { NetworkWithID } from '../../services/networks'

const { networkSwitchSubject, nodeService, addressChangeSubject, addressesUsedSubject } = remote.require(
  './startup/sync-block-task/params',
)

// pass to task a main process subject
AddressesUsedSubject.setSubject(addressesUsedSubject)

export const stopLoopSubject = new Subject()

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (): Promise<string[]> => {
  const addresses: string[] = Address.allAddresses().map(addr => addr.address)
  const lockHashes: string[] = await Promise.all(
    addresses.map(async addr => {
      return LockUtils.addressToLockHash(addr)
    }),
  )
  return lockHashes
}

// call this after network switched
// TODO: listen to network switch
export const switchNetwork = async (networkId: string) => {
  // stop all blocks service
  stopLoopSubject.next('stop')
  // disconnect old connection and connect to new database
  await initConnection(networkId)
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

export const run = () => {
  networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
    if (network) {
      await switchNetwork(network.name)
    }
  })
}

run()

export default run
