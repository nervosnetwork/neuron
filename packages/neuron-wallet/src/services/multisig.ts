import { getConnection, In, Not } from 'typeorm'
import MultisigConfig from '../database/chain/entities/multisig-config'
import MultisigOutput from '../database/chain/entities/multisig-output'
import { MultisigConfigNotExistError, MultisigConfigExistError } from '../exceptions/multisig'
import { rpcBatchRequest } from '../utils/rpc-request'
import { utils } from '@ckb-lumos/lumos'
import MultisigOutputChangedSubject from '../models/subjects/multisig-output-db-changed-subject'
import Transaction from '../models/chain/transaction'
import { OutputStatus } from '../models/chain/output'
import NetworksService from './networks'
import Multisig from '../models/multisig'
import SyncProgress, { SyncAddressType } from '../database/chain/entities/sync-progress'
import { NetworkType } from '../models/network'
import WalletService from './wallets'
import logger from '../utils/logger'

const max64Int = '0x' + 'f'.repeat(16)
export default class MultisigService {
  async saveMultisigConfig(multisigConfig: MultisigConfig) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId: multisigConfig.walletId,
        r: multisigConfig.r,
        m: multisigConfig.m,
        n: multisigConfig.n,
        blake160s: multisigConfig.blake160s.toString(),
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
    await getConnection()
      .createQueryBuilder()
      .update(MultisigConfig)
      .set({
        alias: params.alias ?? result.alias,
        walletId: params.walletId ?? result.walletId,
        r: params.r ?? result.r,
        m: params.m ?? result.m,
        n: params.n ?? result.n,
        blake160s: params.blake160s ?? result.blake160s,
      })
      .where('id = :id', { id: params.id })
      .execute()
    return { ...result, ...params }
  }

  async getMultisigConfig(walletId: string) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId,
      })
      .orderBy('id', 'DESC')
      .getMany()
    return result
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
      const multisigLockHash = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n).computeHash()
      if (existMultisigLockHash.has(multisigLockHash)) {
        return false
      }
      existMultisigLockHash.add(multisigLockHash)
      return true
    })
  }

  static async getLiveCells(multisigConfigs: MultisigConfig[]) {
    const liveCells: MultisigOutput[] = []
    const addressCursorMap: Map<string, string> = new Map()
    let currentMultisigConfigs = MultisigService.removeDulpicateConfig(multisigConfigs)
    const network = NetworksService.getInstance().getCurrent()
    while (currentMultisigConfigs.length) {
      const res = await rpcBatchRequest(
        network.remote,
        currentMultisigConfigs.map(v => {
          const script = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n)
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
              addressCursorMap.get(script.args),
            ],
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          const config = currentMultisigConfigs[idx]
          const script = Multisig.getMultisigScript(config.blake160s, config.r, config.m, config.n)
          addressCursorMap.set(script.args, v?.result?.last_cursor)
          liveCells.push(
            ...v.result.objects
              .filter((object: any) => !object?.output?.type)
              .map((object: any) => MultisigOutput.fromIndexer(object))
          )
          nextMultisigConfigs.push(currentMultisigConfigs[idx])
        }
      })
      currentMultisigConfigs = nextMultisigConfigs
    }
    return liveCells
  }

  static async saveLiveMultisigOutput() {
    const multisigConfigs = await getConnection().getRepository(MultisigConfig).createQueryBuilder().getMany()
    const liveCells = await MultisigService.getLiveCells(multisigConfigs)
    if (liveCells.length) {
      await getConnection().manager.save(liveCells)
      MultisigOutputChangedSubject.getSubject().next('create')
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
          const script = Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n)
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
              addressCursorMap.get(script.args),
            ],
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          const config = currentMultisigConfigs[idx]
          const script = Multisig.getMultisigScript(config.blake160s, config.r, config.m, config.n)
          addressCursorMap.set(script.args, v?.result?.last_cursor)
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
      utils.computeScriptHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n))
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
        utils.computeScriptHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n))
      )
      const syncBlockNumbers = await getConnection()
        .getRepository(SyncProgress)
        .createQueryBuilder()
        .where({ hash: In(multisigScriptHashList) })
        .getMany()
      const syncBlockNumbersMap: Record<string, number> = syncBlockNumbers.reduce(
        (pre, cur) => ({ ...pre, [cur.hash]: cur.blockStartNumber }),
        {}
      )
      await getConnection()
        .getRepository(MultisigConfig)
        .save(
          multisigConfigs.map(v => {
            const blockNumber =
              syncBlockNumbersMap[utils.computeScriptHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n))]
            v.lastestBlockNumber = `0x${BigInt(blockNumber).toString(16)}`
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
    const currentWallet = WalletService.getInstance().getCurrent()
    const multisigConfigs = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId: currentWallet?.id,
      })
      .getMany()
    return multisigConfigs.map(v => ({
      walletId: v.walletId,
      script: Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n),
      addressType: SyncAddressType.Multisig,
      scriptType: 'lock' as CKBRPC.ScriptType,
    }))
  }
}
