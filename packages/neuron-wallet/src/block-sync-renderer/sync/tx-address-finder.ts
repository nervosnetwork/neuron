import { getConnection } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import NetworksService from 'services/networks'
import { AddressPrefix } from 'models/keys/address'
import Output from 'models/chain/output'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import SystemScriptInfo from 'models/system-script-info'
import AddressGenerator from 'models/address-generator'

export interface AnyoneCanPayInfo {
  tokenID: string
  blake160: string
}

// Search for all addresses related to a transaction. These addresses include:
//   * Addresses for previous outputs of this transaction's inputs. (Addresses that send something to this tx)
//   * Addresses for this transaction's outputs. (Addresses that receive something from this tx)
export default class TxAddressFinder {
  private lockHashes: Set<string>
  private tx: Transaction
  private multiSignBlake160s: Set<string>
  private anyoneCanPayLockHashes: Set<string>

  constructor(lockHashes: string[], anyoneCanPayLockHashes: string[], tx: Transaction, multiSignBlake160s: string[]) {
    this.lockHashes = new Set(lockHashes)
    this.anyoneCanPayLockHashes = new Set(anyoneCanPayLockHashes)
    this.tx = tx
    this.multiSignBlake160s = new Set(multiSignBlake160s)
  }

  public addresses = async (): Promise<[boolean, string[], AnyoneCanPayInfo[]]> => {
    const inputAddressesResult = await this.selectInputAddresses()

    const outputsResult: [boolean, Output[], AnyoneCanPayInfo[]] = this.selectOutputs()
    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    const outputAddresses: string[] = outputsResult[1].map(output => {
      return AddressGenerator.toShort(output.lock, addressPrefix)
    })

    return [
      inputAddressesResult[0] || outputsResult[0],
      inputAddressesResult[1].concat(outputAddresses),
      inputAddressesResult[2].concat(outputsResult[2])
    ]
  }

  // [shouldSync, addresses, anyoneCanPayBlake160s]
  private selectOutputs = (): [boolean, Output[], AnyoneCanPayInfo[]] => {
    let shouldSync = false
    // const anyoneCanPayBlake160s: string[] = []
    const anyoneCanPayInfos: AnyoneCanPayInfo[] = []
    const outputs: Output[] = this.tx.outputs!.map((output, index) => {
      if (SystemScriptInfo.isMultiSignScript(output.lock)) {
        const multiSignBlake160 = output.lock.args.slice(0, 42)
        if (this.multiSignBlake160s.has(multiSignBlake160)) {
          shouldSync = true
          output.setMultiSignBlake160(multiSignBlake160)
        }
      }
      if (this.anyoneCanPayLockHashes.has(output.lockHash!)) {
        shouldSync = true
        // anyoneCanPayBlake160s.push(output.lock.args)
        anyoneCanPayInfos.push({
          blake160: output.lock.args,
          tokenID: output.type?.args || "CKBytes"
        })
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

    return [shouldSync, outputs, anyoneCanPayInfos]
  }

  private selectInputAddresses = async (): Promise<[boolean, string[], AnyoneCanPayInfo[]]> => {
    const addresses: string[] = []
    // const anyoneCanPayBlake160s: string[] = []
    const anyoneCanPayInfos: AnyoneCanPayInfo[] = []
    const inputs = this.tx.inputs!.filter(i => i.previousOutput !== null)
    const prefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet

    const outputs = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder()
      .getMany()

    const outputsMap = new Map()
    for (const output of outputs) {
      outputsMap.set(`${output.outPointTxHash}_${output.outPointIndex}`, output)
    }

    let shouldSync = false
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput!
      const output = outputsMap.get(`${outPoint.txHash}_${outPoint.index}`)
      if (output && this.anyoneCanPayLockHashes.has(output.lockHash)) {
        shouldSync = true
        // anyoneCanPayBlake160s.push(output.lockArgs)
        anyoneCanPayInfos.push({
          blake160: output.lockArgs,
          tokenID: output.typeArgs || 'CKBytes'
        })
      }
      if (output && this.lockHashes.has(output.lockHash)) {
        shouldSync = true
        addresses.push(
          AddressGenerator.generate(output.lockScript(), prefix)
        )
      }
      if (output && SystemScriptInfo.isMultiSignScript(output.lockScript())) {
        const multiSignBlake160 = output.lockScript().args.slice(0, 42)
        if (this.multiSignBlake160s.has(multiSignBlake160)) {
          shouldSync = true
          input.setMultiSignBlake160(multiSignBlake160)
        }
      }
    }

    return [shouldSync, addresses, anyoneCanPayInfos]
  }
}
