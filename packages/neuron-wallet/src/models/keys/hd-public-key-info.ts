import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import SystemScriptInfo from '../../models/system-script-info'
import NetworksService from '../../services/networks'
import Address, { AddressType } from './address'

export default class HdPublicKeyInfoModel {
  public walletId: string
  public addressType: AddressType
  public addressIndex: number
  public publicKeyInBlake160: string
  public description?: string

  public get address() {
    return scriptToAddress(
      {
        codeHash: SystemScriptInfo.SECP_CODE_HASH,
        hashType: SystemScriptInfo.SECP_HASH_TYPE,
        args: this.publicKeyInBlake160
      },
      NetworksService.getInstance().isMainnet()
    )
  }

  public get path(): string {
    return Address.pathFor(this.addressType, this.addressIndex)
  }

  constructor(
    walletId: string,
    addressType: AddressType,
    addressIndex: number,
    publicKeyInBlake160: string,
    description?: string
  ) {
    this.walletId = walletId
    this.addressType = addressType
    this.addressIndex = addressIndex
    this.publicKeyInBlake160 = publicKeyInBlake160
    this.description = description
  }

  public static fromObject(params: {
    walletId: string
    addressType: AddressType
    addressIndex: number
    publicKeyInBlake160: string
    description?: string
  }): HdPublicKeyInfoModel {
    return new HdPublicKeyInfoModel(
      params.walletId,
      params.addressType,
      params.addressIndex,
      params.publicKeyInBlake160,
      params.description
    )
  }
}
