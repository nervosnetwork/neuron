import { AddressType } from 'models/keys/address'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { getConnection } from 'typeorm'
import HdPublicKeyInfo from 'database/chain/entities/hd-public-key-info'
import { ChildProcess } from 'utils/worker'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export interface Address {
  walletId: string
  address: string
  path: string
  addressType: AddressType
  addressIndex: number
  blake160: string
  txCount?: number
  liveBalance?: string
  sentBalance?: string
  pendingBalance?: string
  balance?: string
  version?: AddressVersion
  description?: string
  isImporting?: boolean | undefined
  usedByAnyoneCanPay?: boolean | undefined
}

export default class AddressDao {
  public static async create (addresses: Address[]) {
    const publicKeyInfos = addresses.map(addr => {
      return HdPublicKeyInfo.fromObject({
        ...addr,
        publicKeyInBlake160: addr.blake160
      })
    })
    await getConnection().manager.save(publicKeyInfos)
    AddressDbChangedSubject.getSubject().next("Updated")
  }

  public static async allAddresses(): Promise<HdPublicKeyInfo[]> {
    const publicKeyInfos = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .getMany()

    return publicKeyInfos
  }

  public static async allAddressesByWalletId(walletId: string): Promise<HdPublicKeyInfo[]> {
    const publicKeyInfos = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({walletId})
      .getMany()

    publicKeyInfos.sort((lhs, rhs) => {
      return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
    })

    return publicKeyInfos
  }

  public static async updateDescription(walletId: string, address: string, description: string) {
    await getConnection()
      .createQueryBuilder()
      .update(HdPublicKeyInfo)
      .set({
        description
      })
      .where({
        walletId,
        address
      })
      .execute()
  }

  public static async deleteByWalletId(walletId: string) {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(HdPublicKeyInfo)
      .where({walletId})
      .execute()
  }

  static changed() {
    if (ChildProcess.isChildProcess()) {
      ChildProcess.send({
        channel: 'address-db-changed',
        result: 'Updated'
      })
    } else {
      AddressDbChangedSubject.getSubject().next("Updated")
    }
  }
}
