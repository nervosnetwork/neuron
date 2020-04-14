import AssetAccount from "models/asset-account"
import AssetAccountEntity from "database/chain/entities/asset-account"
import { getConnection } from "typeorm"
import AddressService from "./addresses"
import { TransactionGenerator } from "./tx"
import TransactionSender from "./transaction-sender"
import Transaction from "models/chain/transaction"

export default class AssetAccountService {
  public static async getAll(walletID: string): Promise<AssetAccount[]> {
    const assetAccounts = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('asset_account')
      .where({
        walletID,
      })
      .getMany()

    return assetAccounts.map(aa => aa.toModel())
  }

  public static async generateCreateTx(
    walletID: string,
    lockHashes: string[],
    tokenID: string,
    symbol: string,
    fullName: string,
    decimal: string,
    feeRate: string,
    fee: string,
  ): Promise<{
    assetAccount: AssetAccount,
    tx: Transaction
  }> {
    // 1. find next unused address
    const addrObj = AddressService.nextUnusedAddress(walletID)!
    // 2. generate AssetAccount object
    const assetAccount = new AssetAccount(walletID, tokenID, symbol, fullName, decimal, '0', addrObj.blake160)

    // 3. generate tx
    const changeAddrObj = AddressService.nextUnusedChangeAddress(walletID)!
    const tx = await TransactionGenerator.generateCreateAnyoneCanPayTx(
      tokenID,
      lockHashes,
      addrObj.blake160,
      changeAddrObj.blake160,
      feeRate,
      fee
    )

    return {
      assetAccount,
      tx,
    }
  }

  public static async sendTx(walletID: string, assetAccount: AssetAccount, tx: Transaction, password: string): Promise<string> {
    // 1. save AssetAccount
    const connection = getConnection()
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const savedEntity = await connection.manager.save(entity)

    // 2. send tx
    // if failed, remove saved entity
    try {
      const txHash = await new TransactionSender().sendTx(walletID, tx, password)
      return txHash
    } catch (err) {
      await connection.manager.remove(savedEntity)
      throw err
    }
  }

  public static async update(id: number, params: { fullName?: string, symbol?: string, decimal?: string }) {
    return getConnection()
      .createQueryBuilder()
      .update(AssetAccountEntity)
      .set(params).where("id = :id", { id })
      .execute()
  }
}
