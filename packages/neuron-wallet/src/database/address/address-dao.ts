import { AddressType } from 'models/keys/address'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { getConnection } from 'typeorm'
import HdPublicKeyInfo from 'database/chain/entities/hd-public-key-info'

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
    for (const address of addresses) {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(HdPublicKeyInfo)
        .values({
          ...address,
          publicKeyInBlake160: address.blake160
        })
        .execute()
    }
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

}
