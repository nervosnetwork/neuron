import { addressToScript, scriptToHash } from '@nervosnetwork/ckb-sdk-utils'

export default class MultisigConfigModel {
  public id?: number
  public walletId: string
  public m: number
  public n: number
  public r: number
  public addresses: string[]
  public alias?: string
  public fullPayload: string

  constructor(
    walletId: string,
    m: number,
    n: number,
    r: number,
    addresses: string[],
    fullPayload: string,
    alias?: string,
    id?: number
  ) {
    this.walletId = walletId
    this.m = m
    this.n = n
    this.r = r
    this.addresses = addresses
    this.fullPayload = fullPayload
    this.alias = alias
    this.id = id
  }

  public static fromObject(params: {
    walletId: string
    m: number
    n: number
    r: number
    addresses: string[]
    alias: string
    fullPayload: string
    id?: number
  }): MultisigConfigModel {
    return new MultisigConfigModel(
      params.walletId,
      params.m,
      params.n,
      params.r,
      params.addresses,
      params.fullPayload,
      params.alias,
      params.id
    )
  }

  public toJson() {
    return {
      m: this.m,
      n: this.n,
      r: this.r,
      addresses: this.addresses,
      fullPayload: this.fullPayload,
      alias: this.alias
    }
  }

  public getLockHash() {
    return scriptToHash(addressToScript(this.fullPayload))
  }
}
