import { remote } from 'electron'
import { initConnection as initAddressConnection } from 'database/address/ormconfig'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import { NetworkWithID } from 'services/networks'
import { register as registerTxStatusListener } from 'listeners/tx-status'
import { register as registerAddressListener } from 'listeners/address'
import IndexerRPC from 'services/indexer/indexer-rpc'
import Utils from 'services/sync/utils'

import { switchNetwork as syncSwitchNetwork } from './sync'
import { switchNetwork as indexerSwitchNetwork } from './indexer'

// register to listen address updates
registerAddressListener()

const { addressesUsedSubject, databaseInitSubject } = remote.require('./startup/sync-block-task/params')

// pass to task a main process subject
AddressesUsedSubject.setSubject(addressesUsedSubject)

export const testIndexer = async (url: string): Promise<boolean> => {
  const indexerRPC = new IndexerRPC(url)
  try {
    await Utils.retry(3, 100, () => {
      return indexerRPC.getLockHashIndexStates()
    })
    return true
  } catch {
    return false
  }
}

export const run = async () => {
  await initAddressConnection()
  databaseInitSubject.subscribe(async (network: NetworkWithID | undefined) => {
    if (network) {
      const indexerEnabled = await testIndexer(network.remote)
      if (indexerEnabled) {
        await indexerSwitchNetwork(network.remote)
      } else {
        await syncSwitchNetwork(network.remote)
      }
    }
  })
  registerTxStatusListener()
}

run()

export default run
