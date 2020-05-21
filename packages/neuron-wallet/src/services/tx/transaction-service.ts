import { getConnection } from 'typeorm'
import TransactionEntity from 'database/chain/entities/transaction'
import OutputEntity from 'database/chain/entities/output'
import Transaction, { TransactionStatus, SudtInfo } from 'models/chain/transaction'
import InputEntity from 'database/chain/entities/input'
import AddressParser from 'models/address-parser'
import AssetAccountInfo from 'models/asset-account-info'
import BufferUtils from 'utils/buffer'
import AssetAccountEntity from 'database/chain/entities/asset-account'
import SudtTokenInfoEntity from 'database/chain/entities/sudt-token-info'

export interface TransactionsByAddressesParam {
  pageNo: number
  pageSize: number
  addresses: string[]
  walletID: string
}

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

export enum SearchType {
  Address = 'address',
  TxHash = 'txHash',
  Date = 'date',
  Empty = 'empty',
  TokenInfo = 'tokenInfo',
  Unknown = 'unknown',
}

export class TransactionsService {
  public static filterSearchType(value: string) {
    if (value === '') {
      return SearchType.Empty
    }
    if (value.startsWith('ckb') || value.startsWith('ckt')) {
      return SearchType.Address
    }
    if (value.startsWith('0x')) {
      return SearchType.TxHash
    }
    // like '2019-02-09'
    if (value.match(/\d{4}-\d{2}-\d{2}/)) {
      return SearchType.Date
    }
    if (value.match(/^(\d+|-\d+)$/)) {
      // Amount search is not supported
    }
    return SearchType.TokenInfo
  }

  public static async getAllByAddresses(params: TransactionsByAddressesParam, searchValue: string = ''): Promise<PaginationResult<Transaction>> {
    const type: SearchType = TransactionsService.filterSearchType(searchValue)

    const lockScripts = AddressParser.batchParse(params.addresses)
    let lockHashes: string[] = lockScripts.map(s => s.computeHash())
    const blake160s: string[] = lockScripts.map(s => s.args)
    const assetAccountInfo = new AssetAccountInfo()
    const anyoneCanPayLockHashes: string[] = AddressParser
      .batchParse(params.addresses)
      .map(s => assetAccountInfo.generateAnyoneCanPayScript(s.args).computeHash())
    const allLockHashes: string[] = lockHashes.concat(anyoneCanPayLockHashes)

    if (type === SearchType.Address) {
      const hash = AddressParser.parse(searchValue).computeHash()
      if (lockHashes.includes(hash)) {
        lockHashes = [hash]
      } else {
        return {
          totalCount: 0,
          items: []
        }
      }
    }

    const connection = getConnection()
    const repository = connection.getRepository(TransactionEntity)

    let allTxHashes: string[] = []
    if (type === SearchType.TxHash) {
      allTxHashes = [searchValue]
    } else if (type === SearchType.Date) {
      const beginTimestamp = +new Date(new Date(searchValue).toDateString())
      const endTimestamp = beginTimestamp + 86400000 // 24 * 60 * 60 * 1000
      allTxHashes = (await repository
        .createQueryBuilder('tx')
        .select("tx.hash", "txHash")
        .where(
          `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) union select input.transactionHash from input where input.lockHash in (:...lockHashes)) AND (CAST("tx"."timestamp" AS UNSIGNED BIG INT) >= :beginTimestamp AND CAST("tx"."timestamp" AS UNSIGNED BIG INT) < :endTimestamp)`,
          { lockHashes: allLockHashes, beginTimestamp, endTimestamp }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany())
        .map(tx => tx.txHash)
    } else if (type === SearchType.TokenInfo) {
      const assetAccount = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .where(`info.symbol = :searchValue OR info.tokenName = :searchValue OR aa.accountName = :searchValue`, { searchValue })
        .getOne()

      if (!assetAccount) {
        return {
          totalCount: 0,
          items: []
        }
      }

      const tokenID = assetAccount.tokenID
      allTxHashes = (await repository
        .createQueryBuilder('tx')
        .select("tx.hash", "txHash")
        .where(
          `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) AND output.typeArgs = :tokenID union select input.transactionHash from input where input.lockHash in (:...lockHashes) AND input.typeArgs = :tokenID)`,
          { lockHashes: anyoneCanPayLockHashes, tokenID }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany())
        .map(tx => tx.txHash)
    } else {
      allTxHashes = (await repository
        .createQueryBuilder('tx')
        .select("tx.hash", "txHash")
        .where(
          `tx.hash in (select output.transactionHash from output where output.lockHash in (:...lockHashes) union select input.transactionHash from input where input.lockHash in (:...lockHashes))`,
          { lockHashes: allLockHashes }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany())
        .map(tx => tx.txHash)
    }

    const skip = (params.pageNo - 1) * params.pageSize
    const txHashes = allTxHashes.slice(skip, skip + params.pageSize)

    const totalCount: number = allTxHashes.length

    const transactions = await connection
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where('tx.hash IN (:...txHashes)', { txHashes })
      .orderBy(`tx.timestamp`, 'DESC')
      .getMany()

    const inputs = await connection
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .select('input.capacity', 'capacity')
      .addSelect('input.transactionHash', 'transactionHash')
      .addSelect('input.outPointTxHash', 'outPointTxHash')
      .addSelect('input.outPointIndex', 'outPointIndex')
      .where(`input.transactionHash IN (:...txHashes) AND input.lockHash in (:...lockHashes)`, {
        txHashes,
        lockHashes: allLockHashes,
      })
      .getRawMany()

    const outputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select('output.capacity', 'capacity')
      .addSelect('output.transactionHash', 'transactionHash')
      .addSelect('output.daoData', 'daoData')
      .where(`output.transactionHash IN (:...txHashes) AND output.lockHash IN (:...lockHashes)`, {
        txHashes,
        lockHashes: allLockHashes,
      })
      .getRawMany()

    const anyoneCanPayInputs = await connection
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .where(`input.transactionHash IN (:...txHashes) AND input.typeHash IS NOT NULL AND input.lockHash in (:...lockHashes)`, { txHashes, lockHashes: anyoneCanPayLockHashes })
      .getMany()

    const anyoneCanPayOutputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(`output.transactionHash IN (:...txHashes) AND output.typeHash IS NOT NULL AND output.lockHash IN (:...lockHashes)`, { txHashes, lockHashes: anyoneCanPayLockHashes })
      .getMany()

    const inputPreviousTxHashes: string[] = inputs
      .map(i => i.outPointTxHash)
      .filter(h => !!h) as string[]

    const daoCellOutPoints: { txHash: string, index: string }[] = (await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select("output.outPointTxHash", "txHash")
      .addSelect("output.outPointIndex", "index")
      .where('output.daoData IS NOT NULL')
      .getRawMany())
      .filter(o => inputPreviousTxHashes.includes(o.txHash))

    const sums = new Map<string, bigint>()
    const daoFlag = new Map<string, boolean>()
    outputs.map(o => {
      const s = sums.get(o.transactionHash) || BigInt(0)
      sums.set(o.transactionHash, s + BigInt(o.capacity))

      if (o.daoData) {
        daoFlag.set(o.transactionHash, true)
      }
    })

    inputs.map(i => {
      const s = sums.get(i.transactionHash) || BigInt(0)
      sums.set(i.transactionHash, s - BigInt(i.capacity))

      const result = daoCellOutPoints.some(dc => {
        return dc.txHash === i.outPointTxHash && dc.index === i.outPointIndex
      })
      if (result) {
        daoFlag.set(i.transactionHash, true)
      }
    })

    const txs = await Promise.all(
      transactions.map(async tx => {
        const value = sums.get(tx.hash!) || BigInt(0)

        let typeArgs: string | undefined | null
        const sudtInput = anyoneCanPayInputs.find(i => i.transactionHash === tx.hash && assetAccountInfo.isSudtScript(i.typeScript()!))
        if (sudtInput) {
          typeArgs = sudtInput.typeArgs
        } else {
          const sudtOutput = anyoneCanPayOutputs.find(o => o.outPointTxHash === tx.hash && assetAccountInfo.isSudtScript(o.typeScript()!))
          if (sudtOutput) {
            typeArgs = sudtOutput.typeArgs
          }
        }

        let sudtInfo: SudtInfo | undefined

        if (typeArgs) {
          // const typeArgs = sudtInput.typeArgs
          const inputAmount = anyoneCanPayInputs
            .filter(i => i.transactionHash === tx.hash && assetAccountInfo.isSudtScript(i.typeScript()!) && i.typeArgs === typeArgs)
            .map(i => BufferUtils.readBigUInt128LE(i.data))
            .reduce((result, c) => result + c, BigInt(0))
          const outputAmount = anyoneCanPayOutputs
            .filter(o => o.outPointTxHash === tx.hash && assetAccountInfo.isSudtScript(o.typeScript()!) && o.typeArgs === typeArgs)
            .map(o => BufferUtils.readBigUInt128LE(o.data))
            .reduce((result, c) => result + c, BigInt(0))

          const amount = outputAmount - inputAmount
          const tokenInfo = await getConnection()
            .getRepository(SudtTokenInfoEntity)
            .createQueryBuilder('info')
            .leftJoinAndSelect('info.assetAccounts', 'aa')
            .where(`info.tokenID = :typeArgs AND aa.blake160 IN (:...blake160s)`, {
              typeArgs,
              blake160s,
            })
            .getOne()

          if (tokenInfo) {
            sudtInfo = {
              sUDT: tokenInfo,
              amount: amount.toString(),
            }
          }
        }

        return Transaction.fromObject({
          timestamp: tx.timestamp,
          value: value.toString(),
          hash: tx.hash,
          version: tx.version,
          type: value > BigInt(0) ? 'receive' : 'send',
          nervosDao: daoFlag.get(tx.hash!),
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          blockNumber: tx.blockNumber,
          sudtInfo: sudtInfo,
        })
      })
    )

    return {
      totalCount,
      items: txs,
    }
  }

  public static async get(hash: string): Promise<Transaction | undefined> {
    const tx = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .where('transaction.hash is :hash', {hash})
      .leftJoinAndSelect('transaction.inputs', 'input')
      .leftJoinAndSelect('transaction.outputs', 'output')
      .orderBy({
        'input.id': "ASC"
      })
      .getOne()

    if (!tx) {
      return undefined
    }

    return tx.toModel()
  }

  public static blake160sOfTx(tx: Transaction) {
    let inputBlake160s: string[] = []
    let outputBlake160s: string[] = []
    if (tx.inputs) {
      inputBlake160s = tx.inputs
        .map(input => input.lock && input.lock.args)
        .filter(blake160 => blake160) as string[]
    }
    if (tx.outputs) {
      outputBlake160s = tx.outputs.map(output => output.lock.args!)
    }
    return [...new Set(inputBlake160s.concat(outputBlake160s))]
  }

  // tx count with one lockHash and status
  public static async getCountByLockHashesAndStatus(lockHashes: Set<string>, status: Set<TransactionStatus>) {
    const [sql, parameters] = getConnection().driver.escapeQueryWithParameters(`select lockHash, count(DISTINCT(transactionHash)) as cnt from (select lockHash, transactionHash from input union select lockHash, transactionHash from output) as cell left join (select tx.hash from 'transaction' as tx where tx.status in (:...status) AND tx.hash in (select transactionHash from input union select transactionHash from output)) as result on cell.transactionHash = result.hash where lockHash in (:...lockHashes) group by lockHash;`, { status: [...status], lockHashes: [...lockHashes] }, {})

    const count: { lockHash: string, cnt: number }[] = await getConnection().manager.query(sql, parameters)

    const result = new Map<string, number>()
    count.forEach(c => {
      result.set(c.lockHash, c.cnt)
    })

    return result
  }

  public static async updateDescription(hash: string, description: string) {
    const transactionEntity = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        hash,
      })
      .getOne()

    if (!transactionEntity) {
      return undefined
    }
    transactionEntity.description = description
    return getConnection().manager.save(transactionEntity)
  }
}

export default TransactionsService
