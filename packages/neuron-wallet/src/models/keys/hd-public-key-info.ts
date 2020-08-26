import { AddressType } from "./address"

export default class HdPublicKeyInfoModel {
  public walletId: string
  public path: string
  public address: string
  public addressType: AddressType
  public addressIndex: number
  public publicKeyInBlake160: string
  public description?: string

  constructor(
    walletId: string,
    path: string,
    address: string,
    addressType: AddressType,
    addressIndex: number,
    publicKeyInBlake160: string,
    description?: string,
  ) {
    this.walletId = walletId
    this.path = path
    this.address = address
    this.addressType = addressType
    this.addressIndex = addressIndex
    this.publicKeyInBlake160 = publicKeyInBlake160
    this.description = description
  }

  public static fromObject(params: {
    walletId: string,
    path: string,
    address: string,
    addressType: AddressType,
    addressIndex: number,
    publicKeyInBlake160: string,
    description?: string,
  }): HdPublicKeyInfoModel {
    return new HdPublicKeyInfoModel (
      params.walletId,
      params.path,
      params.address,
      params.addressType,
      params.addressIndex,
      params.publicKeyInBlake160,
      params.description,
    )
  }
}
