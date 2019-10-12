import { getConnection } from 'typeorm'
import { Subject } from 'rxjs'
import { Transaction, Cell, OutPoint } from 'types/cell-types'
import OutputEntity from 'database/chain/entities/output'
import { TransactionPersistor } from 'services/tx'
import LockUtils from 'models/lock-utils'
import CheckOutput from './output'
import { addressesUsedSubject as addressesUsedSubjectParam } from '../renderer-params'
import { AddressesWithURL } from 'models/subjects/addresses-used-subject'

export default class CheckTx {
  private tx: Transaction
  private addressesUsedSubject: Subject<AddressesWithURL>
  private url: string

  constructor(
    tx: Transaction,
    url: string,
    addressesUsedSubject: Subject<AddressesWithURL> = addressesUsedSubjectParam,
  ) {
    this.tx = tx
    this.addressesUsedSubject = addressesUsedSubject

    this.url = url
  }

  public check = async (lockHashes: string[]): Promise<string[]> => {
    const outputs: Cell[] = await this.filterOutputs(lockHashes)
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
      this.addressesUsedSubject.next({
        addresses,
        url: this.url,
      })
      return true
    }
    return false
  }

  public filterOutputs = async (lockHashes: string[]) => {
    const cells: Cell[] = (await Promise.all(
      this.tx.outputs!.map(async output => {
        const checkOutput = new CheckOutput(output)
        const result = await checkOutput.checkLockHash(lockHashes)
        if (result) {
          return output
        }
        return false
      })
    )).filter(cell => !!cell) as Cell[]
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
