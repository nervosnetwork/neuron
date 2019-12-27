import { TransactionPersistor } from 'services/tx'
import logger from 'utils/logger'
import DaoUtils from 'models/dao-utils'

import RpcService from 'services/rpc-service'
import RangeForCheck, { CheckResultType } from './range-for-check'
import BlockNumber from './block-number'
import ArrayUtils from 'utils/array'
import CheckTx from './check-and-save/tx'
import CommonUtils from 'utils/common'
import WalletService from 'services/wallets'
import { Block } from 'models/chain/block'
import { BlockHeader } from 'models/chain/block-header'
import OutPoint from 'models/chain/out-point'
import { TransactionWithStatus } from 'models/chain/transaction-with-status'
import { Script } from 'models/chain/script'

export default class Queue {
  private lockHashes: string[]
  private rpcService: RpcService
  private startBlockNumber: bigint
  private endBlockNumber: bigint
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber

  private fetchSize: number = 4

  private stopped: boolean = false
  private inProcess: boolean = false

  private yieldTime = 1

  private url: string

  constructor(
    url: string,
    lockHashes: string[],
    startBlockNumber: string,
    endBlockNumber: string,
    currentBlockNumber: BlockNumber = new BlockNumber(),
    rangeForCheck: RangeForCheck = new RangeForCheck(url),
    start: boolean = true
  ) {
    this.lockHashes = lockHashes
    this.url = url
    this.rpcService = new RpcService(url)
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)
    this.rangeForCheck = rangeForCheck
    this.currentBlockNumber = currentBlockNumber
    if (start) {
      this.start()
    }
  }

  public setLockHashes = (lockHashes: string[]): void => {
    this.lockHashes = lockHashes
  }

  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true

        if (this.lockHashes.length !== 0) {
          let current: bigint = await this.currentBlockNumber.getCurrent()

          const startNumber: bigint = current + BigInt(1)
          const endNumber: bigint = current + BigInt(this.fetchSize)
          const realEndNumber: bigint = endNumber < this.endBlockNumber ? endNumber : this.endBlockNumber

          if (realEndNumber >= this.endBlockNumber) {
            this.yieldTime = 1000
          } else {
            this.yieldTime = 1
          }

          if (realEndNumber >= startNumber) {
            const rangeArr = ArrayUtils.rangeForBigInt(startNumber, realEndNumber).map(num => num.toString())
            await this.pipeline(rangeArr)
          }
        }
      } catch (err) {
        if (err.message.startsWith('connect ECONNREFUSED')) {
          logger.debug(`sync error:`, err)
        } else {
          logger.error(`sync error:`, err)
        }
      } finally {
        await this.yield(this.yieldTime)
        this.inProcess = false
      }
    }
  }

  private yield = async (millisecond: number = 1) => {
    await CommonUtils.sleep(millisecond)
  }

  public stop = () => {
    this.stopped = true
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await this.yield(50)
    }
  }

  public stopAndWait = async (timeout: number = 5000) => {
    this.stop()
    await this.waitForDrained(timeout)
  }

  public pipeline = async (blockNumbers: string[]) => {
    // 1. get blocks
    const blocks: Block[] = await this.rpcService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)

    // 2. check blockHeaders
    const checkResult = await this.checkBlockHeader(blockHeaders)

    if (checkResult.type === CheckResultType.FirstNotMatch) {
      return
    }

    const daoScriptInfo = await DaoUtils.daoScript(this.url)
    const daoScriptHash: string = new Script({
      codeHash: daoScriptInfo.codeHash,
      args: "0x",
      hashType: daoScriptInfo.hashType,
    }).computeHash()

    // 3. check and save
    await this.checkAndSave(blocks, this.lockHashes, daoScriptHash)

    // 4. update currentBlockNumber
    const lastBlock = blocks[blocks.length - 1]
    await this.currentBlockNumber.updateCurrent(BigInt(lastBlock.header.number))

    // 5. update range
    this.rangeForCheck.pushRange(blockHeaders)
  }

  public checkAndSave = async (blocks: Block[], lockHashes: string[], daoScriptHash: string): Promise<void> => {
    const cachedPreviousTxs = new Map()
    for (const block of blocks) {
      if (BigInt(block.header.number) % BigInt(1000) === BigInt(0)) {
        logger.debug(`Scanning from block #${block.header.number}`)
      }
      for (let i = 0; i < block.transactions.length; ++i) {
        const tx = block.transactions[i]
        const checkTx = new CheckTx(tx, this.url, daoScriptHash)
        const addresses = await checkTx.check(lockHashes)
        if (addresses.length > 0) {
          if (i > 0) {
            for (const [inputIndex, input] of tx.inputs!.entries()) {
              const previousTxHash = input.previousOutput!.txHash
              let previousTxWithStatus: TransactionWithStatus | undefined = cachedPreviousTxs.get(previousTxHash)
              if (!previousTxWithStatus) {
                previousTxWithStatus = await this.rpcService.getTransaction(previousTxHash)
                cachedPreviousTxs.set(previousTxHash, previousTxWithStatus)
              }
              const previousTx = previousTxWithStatus!.transaction
              const previousOutput = previousTx.outputs![+input.previousOutput!.index]
              input.setLock(previousOutput.lock)
              input.setCapacity(previousOutput.capacity)
              input.setInputIndex(inputIndex.toString())

              if (
                previousOutput.type &&
                previousOutput.type.computeHash() === daoScriptHash &&
                previousTx.outputsData![+input.previousOutput!.index] === '0x0000000000000000'
              ) {
                const output = tx.outputs![inputIndex]
                if (output) {
                  output.setDepositOutPoint(new OutPoint({
                    txHash: input.previousOutput!.txHash,
                    index: input.previousOutput!.index,
                  }))
                }
              }
            }
          }
          await TransactionPersistor.saveFetchTx(tx)
          await WalletService.updateUsedAddresses(addresses, this.url)
        }
      }
    }
    cachedPreviousTxs.clear()
  }

  public checkBlockHeader = async (blockHeaders: BlockHeader[]) => {
    const checkResult = this.rangeForCheck.check(blockHeaders)
    if (!checkResult.success) {
      if (checkResult.type === CheckResultType.FirstNotMatch) {
        const range = await this.rangeForCheck.getRange()
        const rangeFirstBlockHeader: BlockHeader = range[0]
        await this.currentBlockNumber.updateCurrent(BigInt(rangeFirstBlockHeader.number))
        this.rangeForCheck.clearRange()
        await TransactionPersistor.deleteWhenFork(rangeFirstBlockHeader.number)
        throw new Error(`chain forked: ${checkResult.type}`)
      } else if (checkResult.type === CheckResultType.BlockHeadersNotMatch) {
        // throw here and retry 5 times
        throw new Error(`chain forked: ${checkResult.type}`)
      }
    }

    return checkResult
  }

  public reset = (startBlockNumber: string, endBlockNumber: string) => {
    const startInt: bigint = BigInt(startBlockNumber)
    const endInt: bigint = BigInt(endBlockNumber)

    if (this.startBlockNumber > this.endBlockNumber) {
      return
    }

    this.startBlockNumber = startInt
    this.endBlockNumber = endInt
  }

  public resetEndBlockNumber = (endBlockNumber: string) => {
    this.endBlockNumber = BigInt(endBlockNumber)
  }
}
