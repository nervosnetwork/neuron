import { Address, AddressVersion } from "./address-dao";
import { AddressType } from "models/keys/address";
import Script from "models/chain/script";
import SystemScriptInfo from "models/system-script-info";
import AssetAccountInfo from "models/asset-account-info";

export default class AddressMeta implements Address {
  walletId: string
  address: string
  path: string
  addressType: AddressType
  addressIndex: number
  txCount: number
  liveBalance: string
  sentBalance: string
  pendingBalance: string
  balance: string
  blake160: string
  version: AddressVersion
  description?: string
  isImporting?: boolean | undefined
  usedByAnyoneCanPay?: boolean | undefined

  constructor (
    walletId: string,
    address: string,
    path: string,
    addressType: AddressType,
    addressIndex: number,
    txCount: number,
    liveBalance: string,
    sentBalance: string,
    pendingBalance: string,
    balance: string,
    blake160: string,
    version: AddressVersion,
    description?: string,
    isImporting?: boolean | undefined,
    usedByAnyoneCanPay?: boolean | undefined
    ) {
    this.walletId = walletId
    this.address = address
    this.path = path
    this.addressType = addressType
    this.addressIndex = addressIndex
    this.txCount = txCount
    this.liveBalance = liveBalance
    this.sentBalance = sentBalance
    this.pendingBalance = pendingBalance
    this.balance = balance
    this.blake160 = blake160
    this.version = version
    this.description = description
    this.isImporting = isImporting
    this.usedByAnyoneCanPay = usedByAnyoneCanPay
  }

  public static fromObject(obj: Address) {
    return new AddressMeta(
      obj.walletId,
      obj.address,
      obj.path,
      obj.addressType,
      obj.addressIndex,
      obj.txCount,
      obj.liveBalance,
      obj.sentBalance,
      obj.pendingBalance,
      obj.balance,
      obj.blake160,
      obj.version,
      obj.description,
      obj.isImporting,
      obj.usedByAnyoneCanPay
    )
  }

  public generateDefaultLockScript(): Script {
    return SystemScriptInfo.generateSecpScript(this.blake160)
  }

  public generateSingleMultiSignLockScript(): Script {
    return SystemScriptInfo.generateMultiSignScript(this.blake160)
  }

  public generateACPLockScript(): Script {
    const assetAccountInfo = new AssetAccountInfo()
    return assetAccountInfo.generateAnyoneCanPayScript(this.blake160)
  }
}
