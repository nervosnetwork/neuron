import { getConnection } from 'typeorm'
import { Subject } from 'rxjs'
import { Transaction, Cell, OutPoint } from '../../../app-types/types'
import OutputEntity from '../../../entities/output'
import TransactionsService from '../../transactions'
import CheckOutput from './output'
import LockUtils from '../../../utils/lock-utils'
import { addressesUsedSubject as addressesUsedSubjectParam } from '../renderer-params'

export default class CheckTx {
  private tx: Transaction
  private addressesUsedSubject: Subject<string[]>

  constructor(tx: Transaction, addressesUsedSubject: Subject<string[]> = addressesUsedSubjectParam) {
    this.tx = tx
    this.addressesUsedSubject = addressesUsedSubject
  }

  public check = async (lockHashes: string[]): Promise<boolean> => {
    const outputs: Cell[] = this.filterOutputs(lockHashes)
    const anyInput: boolean = await this.anyInputs()

    if (outputs.length > 0) {
      // found addresses used
      const addresses: string[] = outputs.map(output => {
        return LockUtils.lockScriptToAddress(output.lock)
      })
      this.addressesUsedSubject.next(addresses)
    }

    if (outputs.length > 0 || anyInput) {
      return true
    }
    return false
  }

  public checkAndSave = async (lockHashes: string[]): Promise<boolean> => {
    const checkResult = await this.check(lockHashes)
    if (checkResult) {
      await TransactionsService.saveFetchTx(this.tx)
      return true
    }
    return false
  }

  public filterOutputs = (lockHashes: string[]) => {
    return this.tx.outputs!.filter(output => {
      const checkOutput = new CheckOutput(output)
      return checkOutput.checkLockHash(lockHashes)
    })
  }

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "warn" */
  public anyInputs = async (): Promise<boolean> => {
    const inputs = this.tx.inputs!

    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput
      const { cell } = outPoint
      if (!cell) {
        break
      }
      const output = await getConnection()
        .getRepository(OutputEntity)
        .findOne({
          outPointTxHash: cell.txHash,
          outPointIndex: cell.index,
        })
      if (output) {
        return true
      }
    }

    return false
  }
}
