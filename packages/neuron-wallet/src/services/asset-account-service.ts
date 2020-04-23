import AssetAccount from "models/asset-account"
import AssetAccountEntity from "database/chain/entities/asset-account"
import { getConnection } from "typeorm"
import AddressService from "./addresses"
import { TransactionGenerator } from "./tx"
import TransactionSender from "./transaction-sender"
import Transaction from "models/chain/transaction"
import OutputEntity from "database/chain/entities/output"
import AssetAccountInfo from "models/asset-account-info"
import BufferUtils from "utils/buffer"
import { OutputStatus } from "models/chain/output"
import { AddressVersion } from "database/address/address-dao"
import NetworksService from "./networks"

export default class AssetAccountService {
  public static async getAll(walletID: string, anyoneCanPayLockHashes: string[]): Promise<AssetAccount[]> {
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCodeHash = assetAccountInfo.infos.sudt.codeHash
    const sudtHashType = assetAccountInfo.infos.sudt.hashType

    const assetAccountEntities = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({
        walletID,
      })
      .getMany()

    // calculate balances
    // anyone-can-pay & sudt
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select(`output.lockArgs`, 'lockArgs')
      .addSelect(`output.typeArgs`, 'typeArgs')
      .addSelect('CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .addSelect(`group_concat(output.data)`, 'dataArray')
      .where(`output.status = :liveStatus AND output.lockHash IN (:...lockHashes) AND (output.typeCodeHash IS NULL OR output.typeCodeHash = :typeCodeHash) AND (output.typeHashType IS NULL OR output.typeHashType = :typeHashType)`, {
        liveStatus: OutputStatus.Live,
        lockHashes: anyoneCanPayLockHashes,
        typeCodeHash: sudtCodeHash,
        typeHashType: sudtHashType,
      })
      .groupBy('output.lockArgs')
      .addGroupBy('output.typeArgs')
      .getRawMany()

    // key: blake160:tokenID(typeArgs | CKBytes)
    // value: total balance
    const sumOfAmountMap = new Map<string, bigint>()
    outputs.forEach(output => {
      const blake160 = output.lockArgs
      const tokenID = output.typeArgs || 'CKBytes'
      const isCKB = !output.typeArgs
      const key = blake160 + ":" + tokenID
      const old = sumOfAmountMap.get(key) || BigInt(0)
      if (isCKB) {
        sumOfAmountMap.set(key, old + BigInt(output.sumOfCapacity))
      } else {
        const sumOfAmount = (output.dataArray as string)
          .split(',')
          .map(data => BufferUtils.readBigUInt128LE(data.trim()))
          .reduce((result, c) => result + c, BigInt(0))
        sumOfAmountMap.set(key, old + sumOfAmount)
      }
    })

    const assetAccounts = assetAccountEntities.map(aa => {
      const model = aa.toModel()
      const tokenID = aa.tokenID.startsWith('0x') ? aa.tokenID : 'CKBytes'
      model.balance = sumOfAmountMap.get(aa.blake160 + ":" + tokenID)?.toString() || '0'
      return model
    })

    return assetAccounts
  }

  public static async getAccount(params: { walletID: string, id: number }): Promise<AssetAccount | undefined> {
    return getConnection()
    .getRepository(AssetAccountEntity)
    .createQueryBuilder('aa')
    .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
    .where({ id: +params.id })
    .getOne()
    .then(account => account?.toModel())
  }

  public static async generateCreateTx(
    walletID: string,
    lockHashes: string[],
    tokenID: string,
    symbol: string,
    accountName: string,
    tokenName: string,
    decimal: string,
    feeRate: string,
    fee: string,
  ): Promise<{
    assetAccount: AssetAccount,
    tx: Transaction
  }> {
    // 1. find next unused address
    const addresses = AddressService.allUnusedReceivingAddresses(walletID)
    const usedBlake160s = new Set(await this.blake160sOfAssetAccounts(walletID))
    const addrObj = addresses.find(a => !usedBlake160s.has(a.blake160))!

    // 2. generate AssetAccount object
    const assetAccount = new AssetAccount(walletID, tokenID, symbol, accountName, tokenName, decimal, '0', addrObj.blake160)

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

  private static async blake160sOfAssetAccounts(walletID: string): Promise<string[]> {
    const assetAccounts = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .where({
        walletID,
      })
      .getMany()

    return assetAccounts.map(aa => aa.blake160)
  }

  public static async sendTx(walletID: string, assetAccount: AssetAccount, tx: Transaction, password: string): Promise<string> {
    // 1. save AssetAccount
    const connection = getConnection()
    const entity = AssetAccountEntity.fromModel(assetAccount)
    const savedEntity = await connection.manager.save([entity.sudtTokenInfo, entity])

    // 2. send tx
    // if failed, remove saved entity
    let txHash: string | undefined
    try {
      txHash = await new TransactionSender().sendTx(walletID, tx, password)
    } catch (err) {
      await connection.manager.remove(savedEntity)
      throw err
    }

    // 3. update address for usedByAnyoneCanPay
    const addressVersion = NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
    AddressService.updateUsedByAnyoneCanPay(walletID, assetAccount.blake160, addressVersion, true)

    return txHash
  }

  public static async update(id: number, params: { accountName?: string, tokenName?: string, symbol?: string, decimal?: string }) {
    const assetAccount = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id })
      .getOne()
    if (!assetAccount) {
      return undefined
    }
    if (params.accountName) {
      assetAccount.accountName = params.accountName
    }
    if (params.tokenName) {
      assetAccount.sudtTokenInfo.tokenName = params.tokenName
    }
    if (params.symbol) {
      assetAccount.sudtTokenInfo.symbol = params.symbol
    }
    if (params.decimal) {
      assetAccount.sudtTokenInfo.decimal = params.decimal
    }
    return getConnection().manager.save([assetAccount.sudtTokenInfo, assetAccount])
  }
}
