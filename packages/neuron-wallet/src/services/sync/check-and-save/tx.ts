import { getConnection } from 'typeorm'
import { Subject } from 'rxjs'
import { Transaction, Cell, OutPoint } from 'types/cell-types'
import OutputEntity from 'database/chain/entities/output'
import { TransactionPersistor } from 'services/tx'
import LockUtils from 'models/lock-utils'
import CheckOutput from './output'
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
    const inputAddresses = await this.filterInputs(lockHashes)

    const outputAddresses: string[] = outputs.map(output => {
      return LockUtils.lockScriptToAddress(output.lock)
    })

    const addresses: string[] = inputAddresses.concat(outputAddresses)

    return addresses
  }

  public checkAndSave = async (lockHashes: string[]): Promise<boolean> => {
    const addresses = await this.check(lockHashes)
    if (addresses.length > 0) {
      await TransactionPersistor.saveFetchTx(this.tx)
      this.addressesUsedSubject.next(addresses)
      return true
    }
    return false
  }

  public filterOutputs = (lockHashes: string[]) => {
    const cells: Cell[] = this.tx.outputs!.filter(async output => {
      const checkOutput = new CheckOutput(output)
      const result = await checkOutput.checkLockHash(lockHashes)
      return result
    })
    return cells
  }

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "warn" */
  public filterInputs = async (lockHashes: string[]): Promise<string[]> => {
    const inputs = this.tx.inputs!

    const addresses: string[] = []
    for (const input of inputs) {
      const outPoint: OutPoint | null = input.previousOutput
      if (outPoint) {
        const output = await getConnection()
          .getRepository(OutputEntity)
          .findOne({
            outPointTxHash: outPoint.txHash,
            outPointIndex: outPoint.index,
          })
        if (output && lockHashes.includes(output.lockHash)) {
          addresses.push(LockUtils.lockScriptToAddress(output.lock))
        }
      }
    }

    return addresses
  }
}
