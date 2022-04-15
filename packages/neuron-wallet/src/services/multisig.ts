import { getConnection, In, Not } from 'typeorm'
import MultisigConfig from 'database/chain/entities/multisig-config'
import MultisigOutput from 'database/chain/entities/multisig-output'
import { MultisigConfigNotExistError, MultisigConfigExistError } from 'exceptions/multisig'
import { rpcBatchRequest } from 'utils/rpc-request'
import { addressToScript, scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import MultisigOutputChangedSubject from 'models/subjects/multisig-output-db-changed-subject'
import Transaction from 'models/chain/transaction'
import { OutputStatus } from 'models/chain/output'
import IndexerService from './indexer'
import NetworksService from './networks'

const max64Int = '0x' + 'f'.repeat(16)
export default class MultisigService {
  async saveMultisigConfig(multisigConfig: MultisigConfig) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId: multisigConfig.walletId,
        fullPayload: multisigConfig.fullPayload
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
    addresses?: string[]
    alias?: string
    fullPayload?: string
  }) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        id: params.id
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
        addresses: params.addresses ?? result.addresses,
        fullPayload: params.fullPayload ?? result.fullPayload
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
        walletId
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
        id
      })
      .getOne()
    await getConnection().manager.remove(config)
  }

  static async getLiveCells(multisigConfigs: MultisigConfig[]) {
    const liveCells: MultisigOutput[] = []
    const addressCursorMap: Map<string, string> = new Map()
    let currentMultisigConfigs = multisigConfigs
    while (currentMultisigConfigs.length) {
      const res = await rpcBatchRequest(
        IndexerService.LISTEN_URI,
        currentMultisigConfigs.map(v => {
          const script = addressToScript(v.fullPayload)
          return {
            method: 'get_cells',
            params: [
              {
                script: {
                  code_hash: script.codeHash,
                  hash_type: script.hashType,
                  args: script.args
                },
                script_type: 'lock',
                filter: {
                  block_range: v.lastestBlockNumber ? [v.lastestBlockNumber, max64Int] : undefined
                }
              },
              'desc',
              '0x64',
              addressCursorMap.get(v.fullPayload)
            ]
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          addressCursorMap.set(currentMultisigConfigs[idx].fullPayload, v?.result?.last_cursor)
          liveCells.push(...v.result.objects.map((output: any) => MultisigOutput.fromIndexer(output)))
          nextMultisigConfigs.push(currentMultisigConfigs[idx])
        }
      })
      currentMultisigConfigs = nextMultisigConfigs
    }
    return liveCells
  }

  static async saveLiveMultisigOutput() {
    const multisigConfigs = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .getMany()
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
    while (currentMultisigConfigs.length) {
      const res = await rpcBatchRequest(
        IndexerService.LISTEN_URI,
        currentMultisigConfigs.map(v => {
          const script = addressToScript(v.fullPayload)
          return {
            method: 'get_transactions',
            params: [
              {
                script: {
                  code_hash: script.codeHash,
                  hash_type: script.hashType,
                  args: script.args
                },
                script_type: 'lock',
                filter: {
                  block_range: v.lastestBlockNumber ? [v.lastestBlockNumber, max64Int] : undefined
                }
              },
              'desc',
              '0x64',
              addressCursorMap.get(v.fullPayload)
            ]
          }
        })
      )
      const nextMultisigConfigs: MultisigConfig[] = []
      res.forEach((v, idx) => {
        if (!v.error && v?.result?.objects?.length) {
          addressCursorMap.set(currentMultisigConfigs[idx].fullPayload, v?.result?.last_cursor)
          v.result.objects.forEach((transaction: any) => {
            multisigOutputTxHashList.add(transaction.tx_hash)
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
          params: [v]
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
    const multisigConfigs = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .getMany()
    const multisigLockHashList = multisigConfigs.map(v => scriptToHash(addressToScript(v.fullPayload)))
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(MultisigOutput)
      .where({
        lockHash: Not(In(multisigLockHashList))
      })
      .execute()
    MultisigOutputChangedSubject.getSubject().next('delete')
  }

  static async syncMultisigOutput(lastestBlockNumber: string) {
    try {
      const multisigConfigs = await getConnection()
        .getRepository(MultisigConfig)
        .createQueryBuilder()
        .getMany()
      await MultisigService.saveLiveMultisigOutput()
      await MultisigService.deleteDeadMultisigOutput(multisigConfigs)
      await getConnection()
        .getRepository(MultisigConfig)
        .save(
          multisigConfigs.map(v => ({
            ...v,
            lastestBlockNumber
          }))
        )
    } catch (error) {
      // ignore error, if lastestBlockNumber not update, it will try next time
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
        status: OutputStatus.Pending
      })
      .where({
        outPointTxHashAddIndex: In(inputsOutpointList)
      })
      .execute()
    MultisigOutputChangedSubject.getSubject().next('update')
  }
}
