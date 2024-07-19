import { scriptToAddress } from '../../utils/scriptAndAddress'
import OutputEntity from '../../database/chain/entities/output'
import NetworksService from '../../services/networks'
import Output from '../../models/chain/output'
import OutPoint from '../../models/chain/out-point'
import Transaction from '../../models/chain/transaction'
import SystemScriptInfo from '../../models/system-script-info'
import { getConnection } from '../../database/chain/connection'
import { UDTType } from '../../utils/const'
import AssetAccountInfo from '../../models/asset-account-info'

export interface AnyoneCanPayInfo {
  tokenID: string
  blake160: string
  udtType?: UDTType
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
    const isMainnet = NetworksService.getInstance().isMainnet()
    const outputAddresses: string[] = outputsResult[1].map(output => scriptToAddress(output.lock, isMainnet))

    return [
      inputAddressesResult[0] || outputsResult[0],
      inputAddressesResult[1].concat(outputAddresses),
      inputAddressesResult[2].concat(outputsResult[2]),
    ]
  }

  // [shouldSync, addresses, anyoneCanPayBlake160s]
  private selectOutputs = (): [boolean, Output[], AnyoneCanPayInfo[]] => {
    let shouldSync = false
    // const anyoneCanPayBlake160s: string[] = []
    const anyoneCanPayInfos: AnyoneCanPayInfo[] = []
    const assetAccountInfo = new AssetAccountInfo()
    const outputs: Output[] = this.tx
      .outputs!.map((output, index) => {
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
            tokenID: output.type?.args || 'CKBytes',
            udtType: output.type
              ? assetAccountInfo.isSudtScript(output.type)
                ? UDTType.SUDT
                : UDTType.XUDT
              : undefined,
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
      })
      .filter(output => !!output) as Output[]

    return [shouldSync, outputs, anyoneCanPayInfos]
  }

  private selectInputAddresses = async (): Promise<[boolean, string[], AnyoneCanPayInfo[]]> => {
    const addresses: string[] = []
    // const anyoneCanPayBlake160s: string[] = []
    const anyoneCanPayInfos: AnyoneCanPayInfo[] = []
    const inputs = this.tx.inputs!.filter(i => i.previousOutput !== null)
    const isMainnet = NetworksService.getInstance().isMainnet()
    const assetAccountInfo = new AssetAccountInfo()

    let shouldSync = false
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput!
      const output = await getConnection().getRepository(OutputEntity).findOneBy({
        outPointTxHash: outPoint.txHash,
        outPointIndex: outPoint.index,
      })
      if (output && this.anyoneCanPayLockHashes.has(output.lockHash)) {
        shouldSync = true
        // anyoneCanPayBlake160s.push(output.lockArgs)
        anyoneCanPayInfos.push({
          blake160: output.lockArgs,
          tokenID: output.typeArgs || 'CKBytes',
          udtType: output.typeScript()
            ? assetAccountInfo.isSudtScript(output.typeScript()!)
              ? UDTType.SUDT
              : UDTType.XUDT
            : undefined,
        })
      }
      if (output && this.lockHashes.has(output.lockHash)) {
        shouldSync = true
        addresses.push(scriptToAddress(output.lockScript(), isMainnet))
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
