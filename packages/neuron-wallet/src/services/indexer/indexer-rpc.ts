import Core from '@nervosnetwork/ckb-sdk-core'

import { NetworkWithID } from 'services/networks'
import { networkSwitchSubject } from 'services/sync/renderer-params'

let core: Core
networkSwitchSubject.subscribe((network: NetworkWithID | undefined) => {
  if (network) {
    core = new Core(network.remote)
  }
})

export default class IndexerRPC {
  public deindexLockHash = async (lockHash: string) => {
    return core.rpc.deindexLockHash(lockHash)
  }

  public indexLockHash = async (lockHash: string, indexFrom = '0') => {
    return core.rpc.indexLockHash(lockHash, indexFrom)
  }

  public getTransactionByLockHash = async (
    lockHash: string,
    page: string,
    per: string,
    reverseOrder: boolean = false
  ) => {
    const result = await core.rpc.getTransactionsByLockHash(lockHash, page, per, reverseOrder)
    return result
  }

  public getLockHashIndexStates = async () => {
    return core.rpc.getLockHashIndexStates()
  }

  public getLiveCellsByLockHash = async (
    lockHash: string,
    page: string,
    per: string,
    reverseOrder: boolean = false
  ) => {
    const result = await core.rpc.getLiveCellsByLockHash(lockHash, page, per, reverseOrder)
    return result
  }
}
