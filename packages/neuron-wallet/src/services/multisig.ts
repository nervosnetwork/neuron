import { In, Not } from 'typeorm'
import { getConnection } from '../database/chain/connection'
import MultisigConfig from '../database/chain/entities/multisig-config'
import MultisigOutput from '../database/chain/entities/multisig-output'
import { MultisigConfigNotExistError, MultisigConfigExistError } from '../exceptions/multisig'
import { rpcBatchRequest } from '../utils/rpc-request'
import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import MultisigOutputChangedSubject from '../models/subjects/multisig-output-db-changed-subject'
import Transaction from '../models/chain/transaction'
import { OutputStatus } from '../models/chain/output'
import NetworksService from './networks'
import Multisig from '../models/multisig'
import SyncProgress, { SyncAddressType } from '../database/chain/entities/sync-progress'
import { NetworkType } from '../models/network'
import logger from '../utils/logger'
import { TransactionPersistor } from './tx'
import { DAO_DATA } from '../utils/const'
import RpcService from '../services/rpc-service'
import TransactionWithStatus from '../models/chain/transaction-with-status'
import TxStatus from '../models/chain/tx-status'
import SystemScriptInfo from '../models/system-script-info'
import OutPoint from '../models/chain/out-point'

const max64Int = '0x' + 'f'.repeat(16)
export default class MultisigService {
  async saveMultisigConfig(multisigConfig: MultisigConfig) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        r: multisigConfig.r,
        m: multisigConfig.m,
        n: multisigConfig.n,
        blake160s: multisigConfig.blake160s.toString(),
        lockCodeHash: multisigConfig.lockCodeHash,
      })
      .getCount()
    if (result > 0) {
      throw new MultisigConfigExistError()
    }
    return await getConnection().manager.save(multisigConfig)
  }

  async updateMultisigConfig(params: {
    id: number
    walletId?: string
    r?: number
    m?: number
    n?: number
    blake160s?: string[]
    alias?: string
    startBlockNumber?: number
  }) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        id: params.id,
      })
      .getOne()
    if (!result) {
      throw new MultisigConfigNotExistError()
    }
    await getConnection().getRepository(MultisigConfig).update(params.id, {
      alias: params.alias,
      walletId: params.walletId,
      r: params.r,
      m: params.m,
      n: params.n,
      blake160s: params.blake160s,
      startBlockNumber: params.startBlockNumber,
    })
    return { ...result, ...params }
  }

  async getMultisigConfig() {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .orderBy('id', 'DESC')
      .getMany()
    const existMultisigLockHash: Set<string> = new Set()
    const uniqueMultisigConfigs: MultisigConfig[] = []
    for (const multisigConfig of result) {
      const multisigLockHash = Multisig.getMultisigScript(
        multisigConfig.blake160s,
        multisigConfig.r,
        multisigConfig.m,
        multisigConfig.n,
        multisigConfig.lockCodeHash
      ).computeHash()
      if (existMultisigLockHash.has(multisigLockHash)) {
        await this.deleteConfig(multisigConfig.id)
      } else {
        existMultisigLockHash.add(multisigLockHash)
        uniqueMultisigConfigs.push(multisigConfig)
      }
    }
    return uniqueMultisigConfigs
  }

  async getMultisigConfigById(id: number) {
    return getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        id,
      })
      .getOne()
  }

  async deleteConfig(id: number) {
    const config = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        id,
      })
      .getOne()
    await getConnection().manager.remove(config)
  }

  private static removeDulpicateConfig(multisigConfigs: MultisigConfig[]) {
    const existMultisigLockHash: Set<string> = new Set()
    return multisigConfigs.filter(v => {
      const multisigLockHash = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash).computeHash()
      if (existMultisigLockHash.has(multisigLockHash)) {
        return false
      }
      existMultisigLockHash.add(multisigLockHash)
      return true
    })
  }

  static async getCells(multisigConfigs: MultisigConfig[]) {
    const cells: RPC.IndexerCell[] = []
    const addressCursorMap: Map<string, string> = new Map()
    let currentMultisigConfigs = MultisigService.removeDulpicateConfig(multisigConfigs)
    const network = NetworksService.getInstance().getCurrent()
    while (currentMultisigConfigs.length) {
      const res = await rpcBatchRequest(
        network.remote,
        currentMultisigConfigs.map(v => {
          const script = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash)
          return {
            method: 'get_cells',
            params: [
              {
                script: {
                  code_hash: script.codeHash,
                  hash_type: script.hashType,
                  args: script.args,
                },
                script_type: 'lock',
                filter: {
                  block_range: v.lastestBlockNumber ? [v.lastestBlockNumber, max64Int] : undefined,
                },
              },
              'desc',
              '0x64',
              addressCursorMap.get(scriptToHash(script)),
            ],
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          const config = currentMultisigConfigs[idx]
          const script = Multisig.getMultisigScript(config.blake160s, config.r, config.m, config.n, config.lockCodeHash)
          addressCursorMap.set(scriptToHash(script), v?.result?.last_cursor)
          cells.push(...v.result.objects)
          nextMultisigConfigs.push(currentMultisigConfigs[idx])
        }
      })
      currentMultisigConfigs = nextMultisigConfigs
    }
    return cells
  }

  static async getLiveCells(multisigConfigs: MultisigConfig[]) {
    const cells = await MultisigService.getCells(multisigConfigs)
    return cells.filter(object => !object?.output?.type).map(object => MultisigOutput.fromIndexer(object))
  }

  static async saveLiveMultisigOutput() {
    const multisigConfigs = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getMany()
    const liveCells = await MultisigService.getLiveCells(multisigConfigs)
    if (liveCells.length) {
      await getConnection().manager.save(liveCells)
      MultisigOutputChangedSubject.getSubject().next('create')
    }
  }

  static async saveMultisigDaoTx(multisigConfigs: MultisigConfig[]) {
    const network = NetworksService.getInstance().getCurrent()
    const rpcService = new RpcService(network.remote, network.type)
    const getTx = async (txHash: string) => {
      const txWithStatus: TransactionWithStatus | undefined | { transaction: null; txStatus: TxStatus } =
        await rpcService.getTransaction(txHash)
      if (txWithStatus?.transaction) {
        const tx = Transaction.fromSDK(txWithStatus.transaction)
        tx.blockHash = txWithStatus.txStatus.blockHash || undefined
        if (tx.blockHash) {
          const header = await rpcService.getHeader(tx.blockHash)
          tx.timestamp = header?.timestamp
          tx.blockNumber = header?.number
        }
        return tx
      }
    }
    const multisigTxHashList = await MultisigService.getMultisigTransactionHashList(multisigConfigs)
    for (const txHash of [...multisigTxHashList].reverse()) {
      const tx = await getTx(txHash)
      if (tx) {
        if (tx.inputs.some(input => input.since && +input.since > 0)) {
          await TransactionPersistor.saveFetchTx(tx)
        } else if (tx.outputs.some(output => output.type?.codeHash === SystemScriptInfo.DAO_CODE_HASH)) {
          tx.outputs.forEach((output, index) => {
            if (output.type?.codeHash === SystemScriptInfo.DAO_CODE_HASH) {
              output.daoData = tx.outputsData[index]
              if (tx.outputsData[index] !== DAO_DATA) {
                const previousTxHash = tx.inputs[index].previousOutput!.txHash
                output.setDepositOutPoint(new OutPoint(previousTxHash, tx.inputs[index].previousOutput!.index))
              }
            }
          })
          await TransactionPersistor.saveFetchTx(tx)
        }
      }
    }
  }

  static async getMultisigTransactionHashList(multisigConfigs: MultisigConfig[]) {
    const multisigOutputTxHashList = new Set<string>()
    const addressCursorMap: Map<string, string> = new Map()
    let currentMultisigConfigs = [...multisigConfigs]
    const network = NetworksService.getInstance().getCurrent()
    while (currentMultisigConfigs.length) {
      const res = await rpcBatchRequest(
        network.remote,
        currentMultisigConfigs.map(v => {
          const script = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash)
          return {
            method: 'get_transactions',
            params: [
              {
                script: {
                  code_hash: script.codeHash,
                  hash_type: script.hashType,
                  args: script.args,
                },
                script_type: 'lock',
                filter: {
                  block_range: v.lastestBlockNumber ? [v.lastestBlockNumber, max64Int] : undefined,
                },
              },
              'desc',
              '0x64',
              addressCursorMap.get(scriptToHash(script)),
            ],
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          const config = currentMultisigConfigs[idx]
          const script = Multisig.getMultisigScript(config.blake160s, config.r, config.m, config.n, config.lockCodeHash)
          addressCursorMap.set(scriptToHash(script), v?.result?.last_cursor)
          v.result.objects.forEach((obj: any) => {
            multisigOutputTxHashList.add(obj.tx_hash || obj.transaction?.hash)
          })
          nextMultisigConfigs.push(currentMultisigConfigs[idx])
        }
      })
      currentMultisigConfigs = nextMultisigConfigs
    }
    return multisigOutputTxHashList
  }

  private static async deleteDeadMultisigOutput(multisigConfigs: MultisigConfig[]) {
    const multisigOutputTxHashList = await MultisigService.getMultisigTransactionHashList(multisigConfigs)
    if (multisigOutputTxHashList.size) {
      const network = await NetworksService.getInstance().getCurrent()
      const txList = await rpcBatchRequest(
        network.remote,
        [...multisigOutputTxHashList].map(v => ({
          method: 'get_transaction',
          params: [v],
        }))
      )
      const removeOutputTxHashList: string[] = []
      txList.forEach(v => {
        if (!v.error && v?.result?.transaction?.inputs?.length) {
          v?.result?.transaction?.inputs?.forEach((input: any) => {
            removeOutputTxHashList.push(input.previous_output.tx_hash + input.previous_output.index)
          })
        }
      })
      if (removeOutputTxHashList.length) {
        await getConnection()
          .createQueryBuilder()
          .delete()
          .from(MultisigOutput)
          .where({ outPointTxHashAddIndex: In(removeOutputTxHashList) })
          .execute()
        MultisigOutputChangedSubject.getSubject().next('delete')
      }
    }
  }

  static async deleteRemovedMultisigOutput() {
    const multisigConfigs = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getMany()
    const multisigLockHashList = multisigConfigs.map(v =>
      scriptToHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash))
    )
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(MultisigOutput)
      .where({
        lockHash: Not(In(multisigLockHashList)),
      })
      .execute()
    MultisigOutputChangedSubject.getSubject().next('delete')
  }

  static async saveMultisigSyncBlockNumber(multisigConfigs: MultisigConfig[], lastestBlockNumber: string) {
    const network = await NetworksService.getInstance().getCurrent()
    if (network.type === NetworkType.Light) {
      const multisigScriptHashList = multisigConfigs.map(v =>
        scriptToHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash))
      )
      const syncBlockNumbers = await getConnection()
        .getRepository(SyncProgress)
        .createQueryBuilder()
        .where({ hash: In(multisigScriptHashList) })
        .getMany()
      const syncBlockNumbersMap: Record<string, number> = syncBlockNumbers.reduce(
        (pre, cur) => ({ ...pre, [cur.hash]: cur.localSavedBlockNumber }),
        {}
      )
      await getConnection()
        .getRepository(MultisigConfig)
        .save(
          multisigConfigs.map(v => {
            const blockNumber =
              syncBlockNumbersMap[scriptToHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash))]
            v.lastestBlockNumber = `0x${BigInt(blockNumber ?? v.lastestBlockNumber).toString(16)}`
            return v
          })
        )
    } else {
      await getConnection()
        .getRepository(MultisigConfig)
        .save(
          multisigConfigs.map(v => ({
            ...v,
            lastestBlockNumber,
          }))
        )
    }
  }

  static async syncMultisigOutput(lastestBlockNumber: string) {
    try {
      const multisigConfigs = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getMany()
      await MultisigService.saveLiveMultisigOutput()
      await MultisigService.saveMultisigDaoTx(multisigConfigs)
      await MultisigService.deleteDeadMultisigOutput(multisigConfigs)
      await MultisigService.saveMultisigSyncBlockNumber(multisigConfigs, lastestBlockNumber)
      MultisigOutputChangedSubject.getSubject().next('update')
    } catch (error) {
      // ignore error, if lastestBlockNumber not update, it will try next time
      logger.error('Multisig:\tsync multisig cells failed', error)
    }
  }

  static async saveSentMultisigOutput(transaction: Transaction) {
    const inputsOutpointList = transaction.inputs.map(
      input => `${input.previousOutput?.txHash}0x${(+input.previousOutput!.index)?.toString(16)}`
    )
    const multisigOutputs = transaction.outputs.map((output, idx) => {
      const entity = new MultisigOutput()
      entity.outPointTxHash = transaction.hash || transaction.computeHash()
      entity.outPointIndex = `0x${idx.toString(16)}`
      entity.outPointTxHashAddIndex = entity.outPointTxHash + entity.outPointIndex
      entity.capacity = output.capacity
      entity.lockArgs = output.lock.args
      entity.lockCodeHash = output.lock.codeHash
      entity.lockHashType = output.lock.hashType
      entity.lockHash = output.lockHash
      entity.status = OutputStatus.Sent
      return entity
    })
    await getConnection().manager.save(multisigOutputs)
    await getConnection()
      .createQueryBuilder()
      .update(MultisigOutput)
      .set({
        status: OutputStatus.Pending,
      })
      .where({
        outPointTxHashAddIndex: In(inputsOutpointList),
      })
      .execute()
    MultisigOutputChangedSubject.getSubject().next('update')
  }

  static async getMultisigConfigForLight() {
    const multisigConfigs = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getMany()
    return multisigConfigs.map(v => ({
      walletId: v.walletId,
      script: Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n, v.lockCodeHash),
      addressType: SyncAddressType.Multisig,
      scriptType: 'lock' as CKBRPC.ScriptType,
      startBlockNumber: v.startBlockNumber,
    }))
  }
}
