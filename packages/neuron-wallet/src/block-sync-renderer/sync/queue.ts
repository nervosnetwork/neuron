import { ipcRenderer } from 'electron'
import { BehaviorSubject, Subscription } from 'rxjs'

import { TransactionPersistor } from 'services/tx'
import NodeService from 'services/node'
import WalletService from 'services/wallets'
import RpcService from 'services/rpc-service'
import OutPoint from 'models/chain/out-point'
import Block from 'models/chain/block'
import BlockHeader from 'models/chain/block-header'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import ArrayUtils from 'utils/array'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'
import RangeForCheck, { CheckResultType } from './range-for-check'
import TxAddressFinder from './tx-address-finder'
import SystemScriptInfo from 'models/system-script-info'

export default class Queue {
  private lockHashes: string[]
  private rpcService: RpcService

  private currentBlockNumber = BigInt(0)
  private endBlockNumber = BigInt(0)
  private rangeForCheck: RangeForCheck

  private fetchSize: number = 4

  private tipNumberSubject: BehaviorSubject<string>
  private tipNumberListener: Subscription | undefined

  private stopped: boolean = false
  private inProcess: boolean = false

  private yieldTime = 1

  private multiSignBlake160s: string[]

  constructor(url: string, lockHashes: string[], multiSignBlake160s: string[], startBlockNumber: bigint) {
    this.lockHashes = lockHashes
    this.currentBlockNumber = startBlockNumber
    this.rpcService = new RpcService(url)
    this.rangeForCheck = new RangeForCheck(url)
    this.tipNumberSubject = NodeService.getInstance().tipNumberSubject
    this.multiSignBlake160s = multiSignBlake160s
  }

  public start = async () => {
    await this.expandToTip(await this.rpcService.getTipBlockNumber())

    this.tipNumberListener = this.tipNumberSubject.subscribe(async num => {
      if (num) {
        await this.expandToTip(num)
      }
    })

    while (!this.stopped) {
      try {
        this.inProcess = true

        if (this.lockHashes.length !== 0) {
          const startNumber = this.currentBlockNumber
          const endNumber = this.currentBlockNumber + BigInt(this.fetchSize)
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
          logger.debug(`Sync:\terror:`, err)
        } else {
          logger.error(`Sync:\terror:`, err)
        }
      } finally {
        await CommonUtils.sleep(this.yieldTime)
        this.inProcess = false
      }
    }
  }

  public stop = () => {
    if (this.tipNumberListener) {
      this.tipNumberListener.unsubscribe()
    }
    this.stopped = true
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await CommonUtils.sleep(50)
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

    // 3. check and save
    await this.checkAndSave(blocks)

    // 4. update currentBlockNumber
    const lastBlock = blocks[blocks.length - 1]
    this.updateCurrentBlockNumber(BigInt(lastBlock.header.number) + BigInt(1))

    // 5. update range
    this.rangeForCheck.pushRange(blockHeaders)
  }

  private checkAndSave = async (blocks: Block[]): Promise<void> => {
    const cachedPreviousTxs = new Map()

    for (const block of blocks) {
      if (BigInt(block.header.number) % BigInt(1000) === BigInt(0)) {
        logger.info(`Sync:\tscanning from block #${block.header.number}`)
      }
      for (const [i, tx] of block.transactions.entries()) {
        const [shouldSave, addresses] = await new TxAddressFinder(this.lockHashes, tx, this.multiSignBlake160s).addresses()
        if (shouldSave) {
          if (i > 0) {
            for (const [inputIndex, input] of tx.inputs.entries()) {
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
                previousOutput.type?.computeHash() === SystemScriptInfo.DAO_SCRIPT_HASH &&
                previousTx.outputsData![+input.previousOutput!.index] === '0x0000000000000000'
              ) {
                const output = tx.outputs![inputIndex]
                if (output) {
                  output.setDepositOutPoint(new OutPoint(
                    input.previousOutput!.txHash,
                    input.previousOutput!.index,
                  ))
                }
              }
            }
          }
          await TransactionPersistor.saveFetchTx(tx)
          await WalletService.updateUsedAddresses(addresses)
        }
      }
    }
    cachedPreviousTxs.clear()
  }

  private checkBlockHeader = async (blockHeaders: BlockHeader[]) => {
    const checkResult = this.rangeForCheck.check(blockHeaders)
    if (!checkResult.success) {
      if (checkResult.type === CheckResultType.FirstNotMatch) {
        const range = await this.rangeForCheck.getRange(this.currentBlockNumber)
        const rangeFirstBlockHeader: BlockHeader = range[0]
        this.updateCurrentBlockNumber(BigInt(rangeFirstBlockHeader.number))
        this.rangeForCheck.clearRange()
        await TransactionPersistor.deleteWhenFork(rangeFirstBlockHeader.number)
      }

      throw new Error(`chain forked: ${checkResult.type}`)
    }

    return checkResult
  }

  private updateCurrentBlockNumber(blockNumber: BigInt) {
    this.currentBlockNumber = BigInt(blockNumber)
    ipcRenderer.invoke('synced-block-number-updated', (this.currentBlockNumber - BigInt(1)).toString())
  }

  private async expandToTip(tipNumber: string) {
    if (BigInt(tipNumber) > BigInt(0)) {
      this.endBlockNumber = BigInt(tipNumber)
    }
  }
}
