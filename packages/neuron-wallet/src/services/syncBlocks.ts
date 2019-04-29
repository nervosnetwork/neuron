import { getConnection } from 'typeorm'
import { Script, OutPoint, Cell } from './cells'
import TransactionsService, { Input, Transaction } from './transactions'
import InputEntity from '../entities/Input'
import ckbCore from '../core'

/* eslint no-await-in-loop: "off" */
/* eslint no-restricted-syntax: "warn" */
export default class SyncBlocksService {
  private lockHashesVar: string[]

  constructor(lockHashes: string[]) {
    this.lockHashesVar = lockHashes
  }

  get lockHashes(): string[] {
    return this.lockHashesVar
  }

  set lockHashes(lockHashes: string[]) {
    this.lockHashesVar = lockHashes
  }

  // continue to loop blocks to latest block
  async loopBlocks() {
    const tipBlockNumber: number = await ckbCore.rpc.getTipBlockNumber()
    // TODO: should load currentBlockNumber from local
    const currentBlockNumber = 0
    for (let i = currentBlockNumber; i <= tipBlockNumber; ++i) {
      // TODO: check fork
      const blockHash: string = await ckbCore.rpc.getBlockHash(i)
      const block = await ckbCore.rpc.getBlock(blockHash)
      await this.resolveBlock(block)
    }
  }

  // resolve block
  async resolveBlock(block: CKBComponents.Block) {
    const transactions: Transaction[] = block.commitTransactions.map(t => {
      const inputs: Input[] = t.inputs.map(i => {
        const args = i.args.map(a => ckbCore.utils.bytesToHex(a))
        const previousOutput = i.prevOutput
        const ii: Input = {
          previousOutput,
          args,
        }
        return ii
      })

      const outputs: Cell[] = t.outputs.map(o => {
        let type
        if (o.type) {
          type = {
            binaryHash: o.type.binaryHash,
            args: o.type.args.map(ckbCore.utils.bytesToHex),
          }
        }
        return {
          ...o,
          data: ckbCore.utils.bytesToHex(o.data),
          capacity: o.capacity.toString(),
          lock: {
            binaryHash: o.lock.binaryHash,
            args: o.lock.args.map(ckbCore.utils.bytesToHex),
          },
          type,
        }
      })

      const tx = {
        ...t,
        inputs,
        outputs,
      }

      return tx
    })
    this.resolveTxs(transactions)
  }

  // resolve transactions
  async resolveTxs(transactions: Transaction[]) {
    await transactions.forEach(async tx => {
      await this.resolveTx(tx)
    })
  }

  // resolve single transaction
  async resolveTx(transaction: Transaction) {
    if (this.anyOutput(transaction.outputs!) || SyncBlocksService.anyInput(transaction.inputs!)) {
      TransactionsService.create(transaction)
    }
  }

  anyOutput(outputs: Cell[]): boolean {
    return !!outputs.find(output => {
      return this.checkLockScript(output.lock!)
    })
  }

  public static async anyInput(inputs: Input[]): Promise<boolean> {
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput
      const output = await getConnection()
        .getRepository(InputEntity)
        .findOne({
          outPointHash: outPoint.hash,
          outPointIndex: outPoint.index,
        })
      if (output) {
        return true
      }
    }

    return false
  }

  checkLockScript(lock: Script): boolean {
    const lockHash = TransactionsService.lockScriptToHash(lock)
    return this.checkLockHash(lockHash)
  }

  // is this lockHash belongs to me
  checkLockHash(lockHash: string): boolean {
    return this.lockHashesVar.includes(lockHash)
  }
}
