import { remote } from 'electron'
import { Subject } from 'rxjs'
import SyncBlocksService from '../../services/syncBlocks'
import initConnection from '../../typeorm'
import Address from '../../services/addresses'
import LockUtils from '../../utils/lockUtils'

// read main process properties from `remote.app`
const { app }: { app: any } = remote
const { syncTask } = app
const { networkSwitchSubject, nodeService, addressChangeSubject } = syncTask

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
  const syncBlocksService = new SyncBlocksService(lockHashes, nodeService.tipNumberSubject)

  // TODO: should change to listen real address module event
  addressChangeSubject.subscribe(async () => {
    syncBlocksService.lockHashes = await loadAddressesAndConvert()
  })

  stopLoopSubject.subscribe(() => {
    syncBlocksService.stop()
  })

  await syncBlocksService.loopBlocks()
}

export const run = () => {
  // TODO: add an event on networkId for when it init and changed, it should broadcast a message with networkId
  networkSwitchSubject.subscribe(async (network: any) => {
    if (network) {
      await switchNetwork(network.name)
    }
  })
}

run()

export default run
