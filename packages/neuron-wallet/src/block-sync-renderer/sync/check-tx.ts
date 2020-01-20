import { getConnection } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import LockUtils from 'models/lock-utils'
import NetworksService from 'services/networks'
import { AddressPrefix } from 'models/keys/address'
import DaoUtils from 'models/dao-utils'
import Output from 'models/chain/output'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import Script from 'models/chain/script'

export default class CheckTx {
  private url: string
  private lockHashes: Set<string>
  private tx: Transaction

  constructor(url: string, lockHashes: string[], tx: Transaction) {
    this.url = url
    this.lockHashes = new Set(lockHashes)
    this.tx = tx
  }

  public addresses = async (): Promise<string[]> => {
    const inputAddresses = await this.selectInputAddresses()

    const outputs: Output[] = await this.selectOutputs()
    const addressPrefix = NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
    const outputAddresses: string[] = outputs.map(output => {
      return LockUtils.lockScriptToAddress(output.lock, addressPrefix)
    })

    return inputAddresses.concat(outputAddresses)
  }

  private daoScriptHash = async (): Promise<string> => {
    await DaoUtils.daoScript(this.url)
    return DaoUtils.scriptHash
  }

  private selectOutputs = async (): Promise<Output[]> => {
    const daoScriptHash = await this.daoScriptHash()
    const outputs: Output[] = this.tx.outputs!.map((output, index) => {
      if (this.lockHashes.has(output.lockHash!)) {
        if (output.type) {
          if (output.typeHash === daoScriptHash) {
            this.tx.outputs![index].setDaoData(this.tx.outputsData![index])
          }
        }
        return output
      }
      return false
    }).filter(output => !!output) as Output[]

    return outputs
  }

  private selectInputAddresses = async (): Promise<string[]> => {
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
        if (output && this.lockHashes.has(output.lockHash)) {
          addresses.push(
            LockUtils.lockScriptToAddress(
              new Script(output.lock.codeHash, output.lock.args, output.lock.hashType),
              NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
            )
          )
        }
      }
    }

    return addresses
  }
}
