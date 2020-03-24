import { getConnection } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import LockUtils from 'models/lock-utils'
import NetworksService from 'services/networks'
import { AddressPrefix } from 'models/keys/address'
import Output from 'models/chain/output'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import Script from 'models/chain/script'
import SystemScriptInfo from 'models/system-script-info'

// Search for all addresses related to a transaction. These addresses include:
//   * Addresses for previous outputs of this transaction's inputs. (Addresses that send something to this tx)
//   * Addresses for this transaction's outputs. (Addresses that receive something from this tx)
export default class TxAddressFinder {
  private lockHashes: Set<string>
  private tx: Transaction
  private multiSignBlake160s: Set<string>

  constructor(lockHashes: string[], tx: Transaction, multiSignBlake160s: string[]) {
    this.lockHashes = new Set(lockHashes)
    this.tx = tx
    this.multiSignBlake160s = new Set(multiSignBlake160s)
  }

  public addresses = async (): Promise<[boolean, string[]]> => {
    const inputAddressesResult = await this.selectInputAddresses()

    const outputsResult: [boolean, Output[]] = this.selectOutputs()
    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    const outputAddresses: string[] = outputsResult[1].map(output => {
      return LockUtils.lockScriptToAddress(output.lock, addressPrefix)
    })

    return [inputAddressesResult[0] || outputsResult[0], inputAddressesResult[1].concat(outputAddresses)]
  }

  private selectOutputs = (): [boolean, Output[]] => {
    let shouldSync = false
    const outputs: Output[] = this.tx.outputs!.map((output, index) => {
      if (output.lock.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH) {
        const multiSignBlake160 = output.lock.args.slice(0, 42)
        if (this.multiSignBlake160s.has(multiSignBlake160)) {
          shouldSync = true
          output.setMultiSignBlake160(multiSignBlake160)
        }
      }
      if (this.lockHashes.has(output.lockHash!)) {
        if (output.type) {
          if (output.typeHash === SystemScriptInfo.DAO_SCRIPT_HASH) {
            this.tx.outputs![index].setDaoData(this.tx.outputsData![index])
          }
        }
        shouldSync = true
        return output
      }
      return false
    }).filter(output => !!output) as Output[]

    return [shouldSync, outputs]
  }

  private selectInputAddresses = async (): Promise<[boolean, string[]]> => {
    const addresses: string[] = []
    const inputs = this.tx.inputs!.filter(i => i.previousOutput !== null)

    let shouldSync = false
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput!
      const output = await getConnection()
        .getRepository(OutputEntity)
        .findOne({
          outPointTxHash: outPoint.txHash,
          outPointIndex: outPoint.index,
        })
      if (output && this.lockHashes.has(output.lockHash)) {
        shouldSync = true
        addresses.push(
          LockUtils.lockScriptToAddress(
            new Script(output.lock.codeHash, output.lock.args, output.lock.hashType),
            NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
          )
        )
      }
      if (output && output.lock.codeHash === SystemScriptInfo.MULTI_SIGN_CODE_HASH) {
        const multiSignBlake160 = output.lock.args.slice(0, 42)
        if (this.multiSignBlake160s.has(multiSignBlake160)) {
          shouldSync = true
          input.setMultiSignBlake160(multiSignBlake160)
        }
      }
    }

    return [shouldSync, addresses]
  }
}
