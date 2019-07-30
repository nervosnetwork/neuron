import { getConnection } from 'typeorm'
import { Subject } from 'rxjs'
import { Transaction, Cell, OutPoint } from '../../../types/cell-types'
import OutputEntity from '../../../database/chain/entities/output'
import { SaveTransaction } from '../../tx'
import CheckOutput from './output'
import LockUtils from '../../../models/lock-utils'
import { addressesUsedSubject as addressesUsedSubjectParam } from '../renderer-params'

export default class CheckTx {
  private tx: Transaction
  private addressesUsedSubject: Subject<string[]>

  constructor(tx: Transaction, addressesUsedSubject: Subject<string[]> = addressesUsedSubjectParam) {
    this.tx = tx
    this.addressesUsedSubject = addressesUsedSubject
  }

  public check = async (lockHashes: string[]): Promise<string[]> => {
    const outputs: Cell[] = this.filterOutputs(lockHashes)
    const inputAddresses = await this.filterInputs()

    const outputAddresses: string[] = outputs.map(output => {
      return LockUtils.lockScriptToAddress(output.lock)
    })

    const addresses: string[] = inputAddresses.concat(outputAddresses)

    return addresses
  }

  public checkAndSave = async (lockHashes: string[]): Promise<boolean> => {
    const addresses = await this.check(lockHashes)
    if (addresses.length > 0) {
      await SaveTransaction.saveFetchTx(this.tx)
      this.addressesUsedSubject.next(addresses)
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
  public filterInputs = async (): Promise<string[]> => {
    const inputs = this.tx.inputs!

    const addresses: string[] = []
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
        addresses.push(LockUtils.lockScriptToAddress(output.lock))
      }
    }

    return addresses
  }
}
