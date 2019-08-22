import Core from '@nervosnetwork/ckb-sdk-core'

export default class IndexerRPC {
  private core: Core

  constructor(url: string) {
    this.core = new Core(url)
  }

  public deindexLockHash = async (lockHash: string) => {
    return this.core.rpc.deindexLockHash(lockHash)
  }

  public indexLockHash = async (lockHash: string, indexFrom?: string | undefined) => {
    return this.core.rpc.indexLockHash(lockHash, indexFrom)
  }

  public getTransactionByLockHash = async (
    lockHash: string,
    page: string,
    per: string,
    reverseOrder: boolean = false
  ) => {
    const result = await this.core.rpc.getTransactionsByLockHash(lockHash, page, per, reverseOrder)
    return result
  }

  public getLockHashIndexStates = async () => {
    return this.core.rpc.getLockHashIndexStates()
  }

  public getLiveCellsByLockHash = async (
    lockHash: string,
    page: string,
    per: string,
    reverseOrder: boolean = false
  ) => {
    const result = await this.core.rpc.getLiveCellsByLockHash(lockHash, page, per, reverseOrder)
    return result
  }
}
