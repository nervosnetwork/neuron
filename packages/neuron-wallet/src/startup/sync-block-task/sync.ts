import { ipcRenderer } from 'electron'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import BlockListener from 'services/sync/block-listener'
import { Address } from 'database/address/address-dao'
import initConnection from 'database/chain/ormconfig'
import DaoUtils from 'models/dao-utils'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'

export interface LockHashInfo {
  lockHash: string
  isImporting: boolean | undefined
}

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (nodeURL: string): Promise<string[]> => {
  const lockUtils = new LockUtils(await LockUtils.systemScript(nodeURL))
  const addresses = AddressService.allAddresses().map(addr => addr.address)
  return lockUtils.addressesToAllLockHashes(addresses)
}

// call this after network switched
let blockListener: BlockListener | undefined
export const switchNetwork = async (url: string, genesisBlockHash: string, _chain: string) => {
  // stop all blocks service
  if (blockListener) {
    await blockListener.stopAndWait()
  }

  if (genesisBlockHash === 'stop') {
    return
  }

  // clean LockUtils info and DaoUtils info
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  // disconnect old connection and connect to new database
  await initConnection(genesisBlockHash)
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert(url)
  // start sync blocks service
  blockListener = new BlockListener(url, lockHashes)

  // listen to address created
  AddressCreatedSubject.getSubject().subscribe(async (addresses: Address[]) => {
    if (blockListener) {
      const lockUtils = new LockUtils(await LockUtils.systemScript(url))
      const infos: LockHashInfo[] = addresses.map(addr => {
        const hashes: string[] = lockUtils.addressToAllLockHashes(addr.address)
        // undefined means false
        const isImporting: boolean = addr.isImporting === true
        return hashes.map(h => {
          return {
            lockHash: h,
            isImporting,
          }
        })
      }).reduce((acc, val) => acc.concat(val), [])
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
    const hashes: string[] = await loadAddressesAndConvert(url)
    blockListener = new BlockListener(url, hashes)
    await blockListener.start(true)
  }

  WalletCreatedSubject.getSubject().subscribe(async (type: string) => {
    if (type === 'import') {
      await regenerateListener()
    }
  })

  blockListener.start()
}

ipcRenderer.on('sync-window-will-close', () => {
  if (blockListener) {
    blockListener.stop()
    blockListener = undefined
  }
})
