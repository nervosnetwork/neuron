import { getConnection, In } from "typeorm"
import BufferUtils from "utils/buffer"
import OutputEntity from "database/chain/entities/output"
import Transaction, { TransactionStatus } from "models/chain/transaction"
import AssetAccountInfo from "models/asset-account-info"
import { OutputStatus } from "models/chain/output"
import AssetAccount from "models/asset-account"
import SudtTokenInfoEntity from "database/chain/entities/sudt-token-info"
import AssetAccountEntity from "database/chain/entities/asset-account"
import { CapacityNotEnoughForChange } from "exceptions"
import { MIN_CELL_CAPACITY } from 'services/cells'
import TransactionSender from "./transaction-sender"
import { TransactionGenerator } from "./tx"
import WalletService from "./wallets"

export default class AssetAccountService {

  private static async getACPCells (publicKeyHash: string, tokenId: string = 'CKBytes') {
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayLockHash = assetAccountInfo.generateAnyoneCanPayScript(publicKeyHash).computeHash()
    let typeHash = null
    if (tokenId !== 'CKBytes') {
      typeHash = assetAccountInfo.generateSudtScript(tokenId).computeHash()
    }
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        status: In([OutputStatus.Live, OutputStatus.Sent]),
        lockHash: anyoneCanPayLockHash,
        typeHash,
      })
      .getMany()

    return outputs
  }

  private static async calculateAvailableCKBBalance (publicKeyHash: string) {
    const outputs = await this.getACPCells(publicKeyHash)

    const totalBalance = outputs
      .filter(output => {
        return output.data === '0x'
      })
      .reduce((sum, output) => {
      return sum + BigInt(output.capacity)
    }, BigInt(0))
    const reservedBalance = BigInt(MIN_CELL_CAPACITY)
    const availableBalance = totalBalance - reservedBalance

    return availableBalance >= 0 ? availableBalance.toString() : BigInt(0)
  }

  private static async calculateUDTAccountBalance (publicKeyHash: string, tokenId: string) {
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayLockHash = assetAccountInfo.generateAnyoneCanPayScript(publicKeyHash).computeHash()
    const typeHash = assetAccountInfo.generateSudtScript(tokenId).computeHash()
    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where({
        status: In([OutputStatus.Live, OutputStatus.Sent]),
        lockHash: anyoneCanPayLockHash,
        typeHash,
      })
      .getMany()

    const totalBalance = outputs.reduce((sum, output) => {
      return sum + BigInt(BufferUtils.parseAmountFromSUDTData(output.data.trim()))
    }, BigInt(0))

    return totalBalance
  }

  public static async getAll(walletId: string): Promise<AssetAccount[]> {
    const determineTokenID = (account: AssetAccountEntity) => account.tokenID.startsWith('0x') ? account.tokenID : 'CKBytes'

    const assetAccountEntities = await getConnection()
      .getRepository(AssetAccountEntity)
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
      .where(`
        aa.blake160 IN (
          SELECT publicKeyInBlake160
          FROM hd_public_key_info
          WHERE walletId = :walletId
        )`,
        { walletId }
      )
      .getMany()

    const assetAccounts = await Promise.all(assetAccountEntities
      .map(async aa => {
        const model = aa.toModel()
        const tokenID = determineTokenID(aa)

        const cells = await this.getACPCells(aa.blake160, tokenID)
        if (!cells.length) {
          return
        }

        if (tokenID === 'CKBytes') {
          const bigIntAmount = await this.calculateAvailableCKBBalance(aa.blake160)
          model.balance = bigIntAmount.toString()
        }
        else {
          const bigIntAmount = await this.calculateUDTAccountBalance(aa.blake160, aa.tokenID)
          model.balance = bigIntAmount.toString()
        }

        return model
      })
    )

    const validAccounts: AssetAccount[] = []
    assetAccounts.forEach(aa => {
      if (aa) {
        validAccounts.push(aa)
      }
    })
    return validAccounts
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

    if (isCKB) {
      const bitIntAmount = await this.calculateAvailableCKBBalance(assetAccount.blake160)
      assetAccount.balance = bitIntAmount.toString()
    }
    else {
      const bigIntAmount = await this.calculateUDTAccountBalance(assetAccount.blake160, assetAccount.tokenID)
      assetAccount.balance = bigIntAmount.toString()
    }

    return assetAccount
  }

  public static async generateCreateTx(
    walletID: string,
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
    const wallet = WalletService.getInstance().get(walletID)

    const addresses = await wallet.getNextReceivingAddresses()
    const usedBlake160s = new Set(await this.blake160sOfAssetAccounts())
    const addrObj = !wallet.isHDWallet() ? addresses[0] : addresses.find(a => !usedBlake160s.has(a.blake160))!

    // 2. generate AssetAccount object
    const assetAccount = new AssetAccount(tokenID, symbol, accountName, tokenName, decimal, '0', addrObj.blake160)

    // 3. generate tx
    const changeAddrObj = await wallet.getNextChangeAddress()
    let tx: Transaction | undefined
    try {
      tx = await TransactionGenerator.generateCreateAnyoneCanPayTx(
        tokenID,
        walletID,
        addrObj.blake160,
        changeAddrObj!.blake160,
        feeRate,
        fee
      )
    } catch (err) {
      if (!(err instanceof CapacityNotEnoughForChange)) {
        throw err
      }
      tx = await TransactionGenerator.generateCreateAnyoneCanPayTxUseAllBalance(
        tokenID,
        walletID,
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

  public static async sendTx(walletID: string, assetAccount: AssetAccount, tx: Transaction, password: string, skipSign = false): Promise<string> {
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
    const txHash = await new TransactionSender().sendTx(walletID, tx, password, 0, skipSign)

    // 3. save asset account
    const entity = AssetAccountEntity.fromModel(assetAccount)
    await connection.manager.save([entity.sudtTokenInfo, entity])

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

  public static getTokenInfoList() {
    const repo = getConnection().getRepository(SudtTokenInfoEntity)
    return repo.find().then(list => list.map(item => item.toModel()))
  }
}
