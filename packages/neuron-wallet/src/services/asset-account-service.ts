import AssetAccount from "models/asset-account"
import AssetAccountEntity from "database/chain/entities/asset-account"
import { getConnection } from "typeorm"
import AddressService from "./addresses"
import { TransactionGenerator } from "./tx"
import TransactionSender from "./transaction-sender"
import Transaction, { TransactionStatus } from "models/chain/transaction"
import OutputEntity from "database/chain/entities/output"
import AssetAccountInfo from "models/asset-account-info"
import BufferUtils from "utils/buffer"
import { OutputStatus } from "models/chain/output"
import { AddressVersion } from "database/address/address-dao"
import NetworksService from "./networks"
import SudtTokenInfoEntity from "database/chain/entities/sudt-token-info"
import { CapacityNotEnoughForChange } from "exceptions"

export default class AssetAccountService {
  public static async getAll(blake160s: string[], anyoneCanPayLockHashes: string[]): Promise<AssetAccount[]> {
    const assetAccountInfo = new AssetAccountInfo()
    const sudtCodeHash = assetAccountInfo.infos.sudt.codeHash
    const sudtHashType = assetAccountInfo.infos.sudt.hashType

    const assetAccountEntities = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where(`aa.blake160 IN (:...blake160s)`, { blake160s })
      .getMany()

    // calculate balances
    // anyone-can-pay & sudt
    // balance = live + sent
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select(`output.lockArgs`, 'lockArgs')
      .addSelect(`output.typeArgs`, 'typeArgs')
      .addSelect(`output.status`, 'status')
      .addSelect('CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .addSelect(`group_concat(output.data)`, 'dataArray')
      .where(`output.status IN (:...status) AND output.lockHash IN (:...lockHashes) AND (output.typeCodeHash IS NULL OR output.typeCodeHash = :typeCodeHash) AND (output.typeHashType IS NULL OR output.typeHashType = :typeHashType)`, {
        status: [OutputStatus.Live, OutputStatus.Sent],
        lockHashes: anyoneCanPayLockHashes,
        typeCodeHash: sudtCodeHash,
        typeHashType: sudtHashType,
      })
      .groupBy('output.lockArgs')
      .addGroupBy('output.typeArgs')
      .addGroupBy('output.status')
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
          .map(data => BufferUtils.parseAmountFromSUDTData(data.trim()))
          .reduce((result, c) => result + c, BigInt(0))
        sumOfAmountMap.set(key, old + sumOfAmount)
      }
    })

    const assetAccounts = assetAccountEntities
      .map(aa => {
        const model = aa.toModel()
        const tokenID = aa.tokenID.startsWith('0x') ? aa.tokenID : 'CKBytes'
        model.balance = sumOfAmountMap.get(aa.blake160 + ":" + tokenID)?.toString() || ''
        return model
      }).filter(aa => aa.balance !== '')

    return assetAccounts
  }

  public static async getAccount(params: { walletID: string, id: number }): Promise<AssetAccount | undefined> {
    const assetAccount = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where({ id: +params.id })
      .getOne()
      .then(account => account?.toModel())

    if (!assetAccount) {
      return assetAccount
    }

    const isCKB = !assetAccount.tokenID.startsWith('0x')

    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayLockHash = assetAccountInfo.generateAnyoneCanPayScript(assetAccount.blake160).computeHash()
    const typeHash = isCKB ? null : assetAccountInfo.generateSudtScript(assetAccount.tokenID).computeHash()

    // calculate balances
    // anyone-can-pay & sudt
    const output = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select(`output.lockArgs`, 'lockArgs')
      .addSelect(`output.typeArgs`, 'typeArgs')
      .addSelect('CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .addSelect(`group_concat(output.data)`, 'dataArray')
      .where({
        status: OutputStatus.Live,
        lockHash: anyoneCanPayLockHash,
        typeHash,
      })
      .groupBy('output.lockArgs')
      .addGroupBy('output.typeArgs')
      .getRawOne()

    const sumOfAmount = isCKB ?
      BigInt(output.sumOfCapacity) :
      (output.dataArray as string)
        .split(',')
        .map(data => BufferUtils.parseAmountFromSUDTData(data.trim()))
        .reduce((result, c) => result + c, BigInt(0))

    assetAccount.balance = sumOfAmount.toString()

    return assetAccount
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
    if (tokenID !== 'CKBytes' && !tokenID.startsWith('0x')) {
      throw new Error('TokenID must be CKBytes or start with 0x')
    }

    // 1. find next unused address
    const addresses = AddressService.allUnusedReceivingAddresses(walletID)
    const usedBlake160s = new Set(await this.blake160sOfAssetAccounts())
    const addrObj = addresses.find(a => !usedBlake160s.has(a.blake160))!

    // 2. generate AssetAccount object
    const assetAccount = new AssetAccount(tokenID, symbol, accountName, tokenName, decimal, '0', addrObj.blake160)

    // 3. generate tx
    const changeAddrObj = AddressService.nextUnusedChangeAddress(walletID)!
    let tx: Transaction | undefined
    try {
      tx = await TransactionGenerator.generateCreateAnyoneCanPayTx(
        tokenID,
        lockHashes,
        addrObj.blake160,
        changeAddrObj.blake160,
        feeRate,
        fee
      )
    } catch (err) {
      if (!(err instanceof CapacityNotEnoughForChange)) {
        throw err
      }
      tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        tokenID,
        lockHashes,
        addrObj.blake160,
        feeRate,
        fee
      )
    }

    return {
      assetAccount,
      tx,
    }
  }

  public static async checkAndSaveAssetAccountWhenSync(tokenID: string, blake160: string) {
    const isCKB = tokenID === 'CKBytes'
    const decimal = isCKB ? '8' : ''
    const symbol = isCKB ? 'CKB' : ''
    const tokenName = isCKB ? 'CKBytes' : ''
    const assetAccount = new AssetAccount(tokenID, symbol, '', tokenName, decimal, '0', blake160)
    const assetAccountEntity = AssetAccountEntity.fromModel(assetAccount)
    const sudtTokenInfoEntity = assetAccountEntity.sudtTokenInfo
    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(SudtTokenInfoEntity)
      .values(sudtTokenInfoEntity)
      .onConflict(`("tokenID") DO NOTHING`)
      .execute()

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(AssetAccountEntity)
      .values(assetAccountEntity)
      .onConflict(`("tokenID", "blake160") DO NOTHING`)
      .execute()
  }

  public static async checkAndDeleteWhenFork(startBlockNumber: string, anyoneCanPayLockHashes: string[]) {
    const startBlockNumberInt = BigInt(startBlockNumber)

    const assetAccountInfo = new AssetAccountInfo()
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .select('output.lockHash', 'lockHash')
      .addSelect('output.lockArgs', 'lockArgs')
      .addSelect('output.typeArgs', 'typeArgs')
      .addSelect('group_concat(tx.status)', 'txStatusArray')
      .addSelect('group_concat(tx.blockNumber)', 'blockNumberArray')
      .where(`output.lockHash IN (:...lockHashes) AND (output.typeCodeHash IS NULL OR (output.typeCodeHash = :sudtCodeHash AND output.typeHashType = :sudtHashType))`, {
        lockHashes: anyoneCanPayLockHashes,
        sudtCodeHash: assetAccountInfo.infos.sudt.codeHash,
        sudtHashType: assetAccountInfo.infos.sudt.hashType,
      })
      .groupBy('output.lockHash')
      .addGroupBy('output.typeArgs')
      .getRawMany()

    const result = outputs
      .filter(o => {
        const status = (o.txStatusArray as string).split(',').map(a => a.trim())
        const blockNumbers: bigint[] = (o.blockNumberArray as string).split(',').map(a => BigInt(a.trim())).sort()
        if (
          blockNumbers[blockNumbers.length - 1] >= startBlockNumberInt &&
          !(blockNumbers[0] < startBlockNumberInt) &&
          !status.includes(TransactionStatus.Pending)
        ) {
          return o
        }
        return undefined
      })

    for (const output of result) {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(AssetAccountEntity)
        .where("tokenID = :tokenID AND blake160 = :blake160", {
          tokenID: output.typeArgs || 'CKBytes',
          blake160: output.lockArgs,
        })
        .execute()
    }
  }

  private static async blake160sOfAssetAccounts(): Promise<string[]> {
    const assetAccounts = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .select('aa.blake160', 'blake160')
      .getRawMany()

    return assetAccounts.map(aa => aa.blake160)
  }

  public static async sendTx(walletID: string, assetAccount: AssetAccount, tx: Transaction, password: string): Promise<string> {
    // 1. check AssetAccount exists
    const connection = getConnection()
    const exists = await connection
      .manager
      .query(
        `SELECT EXISTS (SELECT 1 FROM asset_account where tokenID = ? AND blake160 = ?) as exist`,
        [assetAccount.tokenID, assetAccount.blake160]
      )

    if (exists[0].exist === 1) {
      throw new Error(`Asset account already exists!`)
    }

    // 2. send tx
    const txHash = await new TransactionSender().sendTx(walletID, tx, password)

    // 3. save asset account
    const entity = AssetAccountEntity.fromModel(assetAccount)
    await connection.manager.save([entity.sudtTokenInfo, entity])

    // 4. update address for usedByAnyoneCanPay
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

    const isCKB = assetAccount.tokenID === 'CKBytes'

    if (params.accountName) {
      assetAccount.accountName = params.accountName
    }
    if (params.tokenName && !isCKB) {
      assetAccount.sudtTokenInfo.tokenName = params.tokenName
    }
    if (params.symbol && !isCKB) {
      assetAccount.sudtTokenInfo.symbol = params.symbol
    }
    if (params.decimal && !isCKB) {
      assetAccount.sudtTokenInfo.decimal = params.decimal
    }
    return getConnection().manager.save([assetAccount.sudtTokenInfo, assetAccount])
  }
}
