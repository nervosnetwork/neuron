import { AddressType } from "./address"
import { AccountExtendedPublicKey } from "./key"

export default class HdPublicKeyInfoModel {
  public walletId: string
  public address: string
  public addressType: AddressType
  public addressIndex: number
  public publicKeyInBlake160: string
  public description?: string

  public get path(): string {
    return `${AccountExtendedPublicKey.ckbAccountPath}/${this.addressType}/${this.addressIndex}`
  }

  constructor(
    walletId: string,
    address: string,
    addressType: AddressType,
    addressIndex: number,
    publicKeyInBlake160: string,
    description?: string,
  ) {
    this.walletId = walletId
    this.address = address
    this.addressType = addressType
    this.addressIndex = addressIndex
    this.publicKeyInBlake160 = publicKeyInBlake160
    this.description = description
  }

  public static fromObject(params: {
    walletId: string,
    address: string,
    addressType: AddressType,
    addressIndex: number,
    publicKeyInBlake160: string,
    description?: string,
  }): HdPublicKeyInfoModel {
    return new HdPublicKeyInfoModel (
      params.walletId,
      params.address,
      params.addressType,
      params.addressIndex,
      params.publicKeyInBlake160,
      params.description,
    )
  }
}
