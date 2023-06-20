import { utils } from '@ckb-lumos/lumos'
import Multisig from './multisig'

export default class MultisigConfigModel {
  public id?: number
  public walletId: string
  public r: number
  public m: number
  public n: number
  public blake160s: string[]
  public alias?: string

  constructor(walletId: string, r: number, m: number, n: number, blake160s: string[], alias?: string, id?: number) {
    this.walletId = walletId
    this.r = r
    this.m = m
    this.n = n
    this.blake160s = blake160s
    this.alias = alias
    this.id = id
  }

  public static fromObject(params: {
    walletId: string
    m: number
    n: number
    r: number
    blake160s: string[]
    alias?: string
    id?: number
  }): MultisigConfigModel {
    return new MultisigConfigModel(
      params.walletId,
      params.r,
      params.m,
      params.n,
      params.blake160s,
      params.alias,
      params.id
    )
  }

  public toJson() {
    return {
      m: this.m,
      n: this.n,
      r: this.r,
      blake160s: this.blake160s,
      alias: this.alias,
    }
  }

  public getLockHash() {
    return utils.computeScriptHash(Multisig.getMultisigScript(this.blake160s, this.r, this.m, this.n))
  }
}
