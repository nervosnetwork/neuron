import { CKBRPC } from '@ckb-lumos/lumos/rpc'
import TransactionEntity from '../../database/chain/entities/transaction'
import OutputEntity from '../../database/chain/entities/output'
import { getConnection } from '../../database/chain/connection'
import Transaction, { TransactionStatus, NFTType, AssetAccountType } from '../../models/chain/transaction'
import InputEntity from '../../database/chain/entities/input'
import AddressParser from '../../models/address-parser'
import AssetAccountInfo from '../../models/asset-account-info'
import BufferUtils from '../../utils/buffer'
import AssetAccountEntity from '../../database/chain/entities/asset-account'
import exportTransactions from '../../utils/export-history'
import RpcService from '../rpc-service'
import NetworksService from '../networks'
import Script from '../../models/chain/script'
import Input from '../../models/chain/input'
import SudtTokenInfoService from '../sudt-token-info'
import TransactionSize from '../../models/transaction-size'
import Output from '../../models/chain/output'
import { UDTType } from '../../utils/const'

export interface TransactionsByAddressesParam {
  pageNo: number
  pageSize: number
  addresses: string[]
  walletID: string
  sort?: string
  direction?: string
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

const DESC = 'decrease'

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

  public static ComparedTxType(a: Transaction, b: Transaction, direction: string) {
    const aType = a.type ?? ''
    const bType = b.type ?? ''
    if (aType > bType) return direction === DESC ? 1 : -1
    if (aType < bType) return direction === DESC ? -1 : 1
    return 0
  }

  public static ComparedTxTimestamp(a: Transaction, b: Transaction, direction: string) {
    const aTimestamp = a.timestamp ? +a.timestamp : 0
    const bTimestamp = b.timestamp ? +b.timestamp : 0
    if (aTimestamp > bTimestamp) return direction === DESC ? 1 : -1
    if (aTimestamp < bTimestamp) return direction === DESC ? -1 : 1
    return 0
  }

  public static ComparedTxBalance(a: Transaction, b: Transaction, direction: string) {
    const aBalance = a.value ? BigInt(a.value) : BigInt(0)
    const bBalance = b.value ? BigInt(b.value) : BigInt(0)
    if (aBalance > bBalance) return direction === DESC ? 1 : -1
    if (aBalance < bBalance) return direction === DESC ? -1 : 1
    return 0
  }

  private static async getSudtInfo({
    txHash,
    acpUdtInputs,
    acpUdtOutputs,
    udtType,
  }: {
    txHash: string
    acpUdtInputs: InputEntity[]
    acpUdtOutputs: OutputEntity[]
    udtType: UDTType
  }) {
    const udtInput = acpUdtInputs.find(i => i.transactionHash === txHash)
    const udtOutput = acpUdtOutputs.find(o => o.outPointTxHash === txHash)
    const typeArgs: string | undefined | null = udtInput?.typeArgs ?? udtOutput?.typeArgs
    const assetAccountType: AssetAccountType | undefined =
      udtInput || udtOutput ? (udtType === UDTType.SUDT ? AssetAccountType.SUDT : AssetAccountType.XUDT) : undefined
    if (!typeArgs) return undefined
    const inputAmount = acpUdtInputs
      .filter(i => i.transactionHash === txHash && i.typeArgs === typeArgs)
      .map(i => BufferUtils.parseAmountFromSUDTData(i.data))
      .reduce((result, c) => result + c, BigInt(0))
    const outputAmount = acpUdtOutputs
      .filter(o => o.outPointTxHash === txHash && o.typeArgs === typeArgs)
      .map(o => BufferUtils.parseAmountFromSUDTData(o.data))
      .reduce((result, c) => result + c, BigInt(0))
    const amount = outputAmount - inputAmount
    let txType = amount > 0 ? 'receive' : 'send'
    if (udtInput && !udtOutput) {
      txType = 'destroy'
    } else if (!udtInput && udtOutput) {
      txType = 'create'
    }

    return {
      sudtInfo: {
        sUDT: (await SudtTokenInfoService.getSudtTokenInfo(typeArgs, udtType)) ?? undefined,
        amount: amount.toString(),
      },
      txType,
      assetAccountType,
    }
  }

  private static async getAssetCKBInfo({
    txHash,
    acpCKBInputs,
    acpCKBOutputs,
  }: {
    txHash: string
    acpCKBInputs: InputEntity[]
    acpCKBOutputs: OutputEntity[]
  }) {
    const ckbAssetInput = acpCKBInputs.find(i => i.transactionHash === txHash)
    const ckbAssetOutput = acpCKBOutputs.find(o => o.outPointTxHash === txHash)
    if (!ckbAssetInput && !ckbAssetOutput) return
    if (ckbAssetInput && !ckbAssetOutput) {
      return {
        txType: 'destroy',
        assetAccountType: AssetAccountType.CKB,
      }
    }
    if (!ckbAssetInput && ckbAssetOutput) {
      return {
        txType: 'create',
        assetAccountType: AssetAccountType.CKB,
      }
    }
  }

  private static getNtfInfo({
    txHash,
    nftInputs,
    nftOutputs,
  }: {
    txHash: string
    nftInputs: InputEntity[]
    nftOutputs: OutputEntity[]
  }) {
    const sendNFTCell = nftInputs.find(i => i.transactionHash === txHash)
    const receiveNFTCell = nftOutputs.find(o => o.outPointTxHash === txHash)

    if (sendNFTCell) {
      return { type: NFTType.Send, data: sendNFTCell.typeArgs! }
    }
    if (receiveNFTCell) {
      return { type: NFTType.Receive, data: receiveNFTCell.typeArgs! }
    }
  }

  private static getDAOCapacity(
    ckbChange: bigint,
    txDaoInfo?: {
      inputs: {
        capacity: string
        transactionHash: string
        outPointTxHash: string
        outPointIndex: string
        data: string
      }[]
      outputs: {
        capacity: string
        transactionHash: string
        daoData: string
      }[]
    }
  ) {
    if (!txDaoInfo) return
    if (txDaoInfo.inputs.length && !txDaoInfo.outputs.length) {
      return txDaoInfo.inputs.reduce((pre, cur) => BigInt(cur.capacity) + pre, ckbChange).toString()
    }
    if (!txDaoInfo.inputs.length && txDaoInfo.outputs.length) {
      return `-${txDaoInfo.outputs.reduce((pre, cur) => BigInt(cur.capacity) + pre, BigInt(0)).toString()}`
    }
  }

  private static groupAssetCells<T extends { typeScript: InputEntity['typeScript'] }>(cells: T[]) {
    const assetAccountInfo = new AssetAccountInfo()
    const acpSudtCells: T[] = []
    const acpCKBCells: T[] = []
    const acpXudtCells: T[] = []
    cells.forEach(v => {
      const typeScript = v.typeScript()
      if (typeScript) {
        if (assetAccountInfo.isSudtScript(typeScript)) {
          acpSudtCells.push(v)
        } else if (assetAccountInfo.isXudtScript(typeScript)) {
          acpXudtCells.push(v)
        }
      } else {
        acpCKBCells.push(v)
      }
    })
    return {
      acpCKBCells,
      acpSudtCells,
      acpXudtCells,
    }
  }

  public static async getAllByAddresses(
    params: TransactionsByAddressesParam,
    searchValue: string = ''
  ): Promise<PaginationResult<Transaction>> {
    const type: SearchType = TransactionsService.filterSearchType(searchValue)

    const assetAccountInfo = new AssetAccountInfo()

    const connection = getConnection()
    const repository = connection.getRepository(TransactionEntity)
    const nftCodehash = assetAccountInfo.getNftInfo().codeHash

    let allTxHashes: string[] = []

    if (type === SearchType.Address) {
      const lockHashToSearch = AddressParser.parse(searchValue).computeHash()
      allTxHashes = await connection
        .createQueryRunner()
        .query(
          `
            SELECT transactionHash from (
              SELECT output.transactionHash FROM output WHERE output.lockHash = @0
              UNION
              SELECT input.transactionHash FROM input WHERE input.lockHash = @0
              UNION
              SELECT tx_lock.transactionHash FROM tx_lock WHERE tx_lock.lockHash = @0
            )
            INTERSECT
            SELECT transactionHash from (
              SELECT output.transactionHash FROM output WHERE output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = @1)
              UNION
              SELECT input.transactionHash FROM input WHERE input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = @1)
            )
          `,
          [lockHashToSearch, params.walletID]
        )
        .then<string[]>((txs: { transactionHash: string }[]) => txs.map(tx => tx.transactionHash))
    } else if (type === SearchType.TxHash) {
      allTxHashes = await repository
        .createQueryBuilder('tx')
        .select('tx.hash', 'txHash')
        .where(
          `tx.hash
        IN
          (
            SELECT transactionHash from (
              SELECT output.transactionHash FROM output WHERE output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
              UNION
              SELECT input.transactionHash FROM input WHERE input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
            )
            WHERE transactionHash = :txHash
          )
        `,
          { walletId: params.walletID, txHash: searchValue }
        )
        .orderBy('tx.timestamp', 'DESC')
        .getRawMany()
        .then(txs => txs.map(tx => tx.txHash))
    } else if (type === SearchType.Date) {
      const beginTimestamp = +new Date(new Date(searchValue).toDateString())
      const endTimestamp = beginTimestamp + 86400000 // 24 * 60 * 60 * 1000
      allTxHashes = (
        await repository
          .createQueryBuilder('tx')
          .select('tx.hash', 'txHash')
          .where(
            `tx.hash in (
            select output.transactionHash from output where output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
            union
            select input.transactionHash from input where input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
          )
          AND
            (
              CAST("tx"."timestamp" AS UNSIGNED BIG INT) >= :beginTimestamp AND CAST("tx"."timestamp" AS UNSIGNED BIG INT) < :endTimestamp
            )`,
            { walletId: params.walletID, beginTimestamp, endTimestamp }
          )
          .orderBy('tx.timestamp', 'DESC')
          .getRawMany()
      ).map(tx => tx.txHash)
    } else if (type === SearchType.TokenInfo) {
      const assetAccount = await getConnection()
        .getRepository(AssetAccountEntity)
        .createQueryBuilder('aa')
        .leftJoinAndSelect('aa.sudtTokenInfo', 'info')
        .where(`info.symbol = :searchValue OR info.tokenName = :searchValue OR aa.accountName = :searchValue`, {
          searchValue,
        })
        .getOne()

      if (!assetAccount) {
        return {
          totalCount: 0,
          items: [],
        }
      }

      const tokenID = assetAccount.tokenID
      allTxHashes = (
        await repository
          .createQueryBuilder('tx')
          .select('tx.hash', 'txHash')
          .where(
            `tx.hash in (
            select output.transactionHash from output
              where
                output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
                output.lockCodeHash = :lockCodeHash AND
                output.typeArgs = :tokenID
            union
            select input.transactionHash from input
              where
                input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
                input.lockCodeHash = :lockCodeHash AND
                input.typeArgs = :tokenID
          )`,
            {
              walletId: params.walletID,
              lockCodeHash: assetAccountInfo.anyoneCanPayCodeHash,
              tokenID,
            }
          )
          .orderBy('tx.timestamp', 'DESC')
          .getRawMany()
      ).map(tx => tx.txHash)
    } else {
      allTxHashes = (
        await repository
          .createQueryBuilder('tx')
          .select('tx.hash', 'txHash')
          .where(
            `tx.hash in (
            select output.transactionHash from output where output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
            union
            select input.transactionHash from input where input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
          )`,
            { walletId: params.walletID }
          )
          .orderBy('tx.timestamp', 'DESC')
          .getRawMany()
      ).map(tx => tx.txHash)
    }

    const skip = (params.pageNo - 1) * params.pageSize
    const needSort =
      ['type', 'value', 'timestamp'].includes(params.sort ?? '') &&
      ['increase', 'decrease'].includes(params.direction ?? '')
    const txHashes = needSort ? allTxHashes : allTxHashes.slice(skip, skip + params.pageSize)

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
      .addSelect('input.data', 'data')
      .where(
        `
        input.transactionHash IN (:...txHashes) AND
        input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
      `,
        {
          txHashes,
          walletId: params.walletID,
        }
      )
      .getRawMany<{
        capacity: string
        transactionHash: string
        outPointTxHash: string
        outPointIndex: string
        data: string
      }>()

    const outputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select('output.capacity', 'capacity')
      .addSelect('output.transactionHash', 'transactionHash')
      .addSelect('output.daoData', 'daoData')
      .where(
        `
        output.transactionHash IN (:...txHashes) AND
        output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)
      `,
        {
          txHashes,
          walletId: params.walletID,
        }
      )
      .getRawMany<{ capacity: string; transactionHash: string; daoData: string }>()

    const assetAccountInputs = await connection
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .where(
        `
        input.transactionHash IN (:...txHashes) AND
        input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
        input.lockCodeHash = :lockCodeHash`,
        {
          txHashes,
          walletId: params.walletID,
          lockCodeHash: assetAccountInfo.anyoneCanPayCodeHash,
        }
      )
      .getMany()

    const assetAccountOutputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(
        `
        output.transactionHash IN (:...txHashes) AND
        output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
        output.lockCodeHash = :lockCodeHash`,
        {
          txHashes,
          walletId: params.walletID,
          lockCodeHash: assetAccountInfo.anyoneCanPayCodeHash,
        }
      )
      .getMany()

    const nftInputs = await connection
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .where(
        `
        input.transactionHash IN (:...txHashes) AND
        input.typeHash IS NOT NULL AND
        input.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
        input.typeCodeHash = :nftCodehash`,
        {
          txHashes,
          walletId: params.walletID,
          nftCodehash,
        }
      )
      .getMany()

    const nftOutputs = await connection
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .where(
        `
        output.transactionHash IN (:...txHashes) AND
        output.typeHash IS NOT NULL AND
        output.lockArgs in (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId) AND
        output.typeCodeHash = :nftCodehash`,
        {
          txHashes,
          walletId: params.walletID,
          nftCodehash,
        }
      )
      .getMany()

    const inputPreviousTxHashes: string[] = inputs.map(i => i.outPointTxHash).filter(h => !!h) as string[]

    const daoCellOutPoints: { txHash: string; index: string }[] = (
      await getConnection()
        .getRepository(OutputEntity)
        .createQueryBuilder('output')
        .select('output.outPointTxHash', 'txHash')
        .addSelect('output.outPointIndex', 'index')
        .where('output.daoData IS NOT NULL')
        .getRawMany()
    ).filter(o => inputPreviousTxHashes.includes(o.txHash))

    const sums = new Map<string, bigint>()
    const daoInfo = new Map<string, { inputs: typeof inputs; outputs: typeof outputs }>()
    outputs.map(o => {
      const s = sums.get(o.transactionHash) || BigInt(0)
      sums.set(o.transactionHash, s + BigInt(o.capacity))

      if (o.daoData) {
        if (daoInfo.has(o.transactionHash)) {
          daoInfo.get(o.transactionHash)!.outputs.push(o)
        } else {
          daoInfo.set(o.transactionHash, { inputs: [], outputs: [o] })
        }
      }
    })

    inputs.map(i => {
      const s = sums.get(i.transactionHash) || BigInt(0)
      sums.set(i.transactionHash, s - BigInt(i.capacity || 0))

      const result = daoCellOutPoints.some(dc => {
        return dc.txHash === i.outPointTxHash && dc.index === i.outPointIndex
      })
      if (result) {
        if (daoInfo.has(i.transactionHash)) {
          daoInfo.get(i.transactionHash)!.inputs.push(i)
        } else {
          daoInfo.set(i.transactionHash, { inputs: [i], outputs: [] })
        }
      }
    })

    const {
      acpCKBCells: acpCKBInputs,
      acpSudtCells: acpSudtInputs,
      acpXudtCells: acpXudtInputs,
    } = TransactionsService.groupAssetCells(assetAccountInputs)
    const {
      acpCKBCells: acpCKBOutputs,
      acpSudtCells: acpSudtOutputs,
      acpXudtCells: acpXudtOutputs,
    } = TransactionsService.groupAssetCells(assetAccountOutputs)
    const txs = await Promise.all(
      transactions.map(async tx => {
        const value = sums.get(tx.hash!) || BigInt(0)
        const typeScriptInfo =
          (await TransactionsService.getSudtInfo({
            txHash: tx.hash,
            acpUdtInputs: acpSudtInputs,
            acpUdtOutputs: acpSudtOutputs,
            udtType: UDTType.SUDT,
          })) ||
          (await TransactionsService.getSudtInfo({
            txHash: tx.hash,
            acpUdtInputs: acpXudtInputs,
            acpUdtOutputs: acpXudtOutputs,
            udtType: UDTType.XUDT,
          })) ||
          (await TransactionsService.getAssetCKBInfo({
            txHash: tx.hash,
            acpCKBInputs,
            acpCKBOutputs,
          }))

        return Transaction.fromObject({
          timestamp: tx.timestamp,
          value: value.toString(),
          hash: tx.hash,
          version: tx.version,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          blockNumber: tx.blockNumber,
          ...typeScriptInfo,
          type: typeScriptInfo?.txType ?? (value > BigInt(0) ? 'receive' : 'send'),
          nftInfo: TransactionsService.getNtfInfo({ txHash: tx.hash, nftInputs, nftOutputs }),
          nervosDao: !!daoInfo.get(tx.hash),
          daoCapacity: TransactionsService.getDAOCapacity(value, daoInfo.get(tx.hash)),
        })
      })
    )

    const totalCount: number = SearchType.TxHash === type ? txs.length : allTxHashes.length

    return {
      totalCount,
      items: needSort
        ? txs
            .sort((a, b) => {
              if (params.sort === 'type') return TransactionsService.ComparedTxType(a, b, params.direction!)
              if (params.sort === 'value') return TransactionsService.ComparedTxBalance(a, b, params.direction!)
              if (params.sort === 'timestamp') return TransactionsService.ComparedTxTimestamp(a, b, params.direction!)
              return 0
            })
            .slice(skip, skip + params.pageSize)
        : txs,
    }
  }

  public static async get(hash: string): Promise<Transaction | undefined> {
    const txInDB = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .where('transaction.hash is :hash', { hash })
      .getOne()
    if (!txInDB) {
      return undefined
    }
    const network = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(network.remote, network.type)
    const txWithStatus = await rpcService.getTransaction(hash)
    if (!txWithStatus?.transaction) {
      return undefined
    }
    const tx = txInDB.toModel()
    tx.inputs = await this.fillInputFields(txWithStatus.transaction.inputs)
    tx.outputs = txWithStatus.transaction.outputs.map((v, idx) =>
      Output.fromObject({ ...v, data: txWithStatus.transaction.outputsData[idx] })
    )
    tx.size = TransactionSize.tx(tx)
    tx.cycles = txWithStatus.cycles
    return tx
  }

  private static async fillInputFields(inputs: Input[]) {
    const inputTxHashes = inputs.map(v => v.previousOutput?.txHash).filter((v): v is string => !!v)
    if (!inputTxHashes.length) return inputs
    const url: string = NetworksService.getInstance().getCurrent().remote
    const ckb = new CKBRPC(url)
    const inputTxs = await ckb
      .createBatchRequest<'getTransaction', string[], CKBComponents.TransactionWithStatus[]>(
        inputTxHashes.map(v => ['getTransaction', v])
      )
      .exec()
    const inputTxMap = new Map<string, CKBComponents.Transaction>()
    inputTxs.forEach((v: { transaction: CKBComponents.Transaction }, idx: number) => {
      inputTxMap.set(inputTxHashes[idx], v.transaction)
    })
    return inputs.map(v => {
      if (!v.previousOutput?.txHash) return v
      const output = inputTxMap.get(v.previousOutput.txHash)?.outputs?.[+v.previousOutput.index]
      if (!output) return v
      v.setCapacity(output.capacity)
      v.setLock(Script.fromSDK(output.lock))
      if (output.type) {
        v.setType(Script.fromSDK(output.type))
      }
      return v
    })
  }

  public static blake160sOfTx(tx: Transaction) {
    let inputBlake160s: string[] = []
    let outputBlake160s: string[] = []
    if (tx.inputs) {
      inputBlake160s = tx.inputs.map(input => input.lock && input.lock.args).filter(blake160 => blake160) as string[]
    }
    if (tx.outputs) {
      outputBlake160s = tx.outputs.map(output => output.lock.args!)
    }
    return [...new Set(inputBlake160s.concat(outputBlake160s))]
  }

  // tx count with one lockHash and status
  public static async getCountByLockHashesAndStatus(lockHashes: Set<string>, status: Set<TransactionStatus>) {
    const [sql, parameters] = getConnection().driver.escapeQueryWithParameters(
      `select lockHash, count(DISTINCT(transactionHash)) as cnt from (select lockHash, transactionHash from input union select lockHash, transactionHash from output) as cell left join (select tx.hash from 'transaction' as tx where tx.status in (:...status) AND tx.hash in (select transactionHash from input union select transactionHash from output)) as result on cell.transactionHash = result.hash where lockHash in (:...lockHashes) group by lockHash;`,
      { status: [...status], lockHashes: [...lockHashes] },
      {}
    )

    const count: { lockHash: string; cnt: number }[] = await getConnection().manager.query(sql, parameters)

    const result = new Map<string, number>()
    count.forEach(c => {
      result.set(c.lockHash, c.cnt)
    })

    return result
  }

  public static async getTxCountsByWalletId(walletId: string, lock?: Omit<CKBComponents.Script, 'args'>) {
    const [sql, parameters] = getConnection().driver.escapeQueryWithParameters(
      `
        SELECT
          lockArgs,
          count(DISTINCT (transactionHash)) AS cnt
        FROM (
          SELECT
            lockArgs,
            transactionHash
          FROM
            input
          WHERE
            lockArgs in(
              SELECT
                hd_public_key_info.publicKeyInBlake160 FROM hd_public_key_info
              WHERE
                walletId = :walletId
            )
            ${lock ? 'AND lockCodeHash = :lockCodeHash AND lockHashType = :lockHashType' : ''}
          UNION
          SELECT
            lockArgs,
            transactionHash
          FROM
            output
          WHERE
            lockArgs in(
              SELECT
                hd_public_key_info.publicKeyInBlake160 FROM hd_public_key_info
              WHERE
                walletId = :walletId
            )
            ${lock ? 'AND lockCodeHash = :lockCodeHash AND lockHashType = :lockHashType' : ''}
        ) AS cell
        GROUP BY
          lockArgs;
        `,
      {
        walletId,
        lockCodeHash: lock?.codeHash,
        lockHashType: lock?.hashType,
      },
      {}
    )

    const count: { lockArgs: string; cnt: number }[] = await getConnection().manager.query(sql, parameters)

    const result = new Map<string, number>()
    count.forEach(c => {
      result.set(c.lockArgs, c.cnt)
    })

    return result
  }

  public static async checkNonExistTransactionsByHashes(hashes: string[]) {
    const results = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .select('tx.hash', 'hash')
      .where('tx.hash IN (:...hashes)', { hashes })
      .getRawMany()

    const existHashesSet = new Set(results.map(result => result.hash))
    const nonExistHashes: string[] = []

    for (const hash of hashes) {
      if (!existHashesSet.has(hash)) {
        nonExistHashes.push(hash)
      }
    }

    return nonExistHashes
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

  public static async exportTransactions({ walletID, filePath }: { walletID: string; filePath: string }) {
    const total = await exportTransactions({ walletID, filePath })
    return total
  }
}

export default TransactionsService
