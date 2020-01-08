import { getConnection } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import { TransactionPersistor } from 'services/tx'
import LockUtils from 'models/lock-utils'
import CheckOutput from './output'
import NetworksService from 'services/networks'
import { AddressPrefix } from 'models/keys/address'
import WalletService from 'services/wallets'
import Output from 'models/chain/output'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import Script from 'models/chain/script'

export default class CheckTx {
  private tx: Transaction
  private url: string
  private daoTypeHash: string

  constructor(
    tx: Transaction,
    url: string,
    daoTypeHash: string
  ) {
    this.tx = tx
    this.url = url
    this.daoTypeHash = daoTypeHash
  }

  public check = async (lockHashes: string[]): Promise<string[]> => {
    const outputs: Output[] = this.filterOutputsOfWallets(lockHashes)
    const inputAddresses = await this.filterInputsOfWallets(lockHashes)

    const outputAddresses: string[] = outputs.map(output => {
      return LockUtils.lockScriptToAddress(
        output.lock,
        NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
      )
    })

    const addresses: string[] = inputAddresses.concat(outputAddresses)

    return addresses
  }

  public checkAndSave = async (lockHashes: string[]): Promise<boolean> => {
    const addresses = await this.check(lockHashes)
    if (addresses.length > 0) {
      await TransactionPersistor.saveFetchTx(this.tx)
      await WalletService.updateUsedAddresses(addresses, this.url)
      return true
    }
    return false
  }

  public filterOutputsOfWallets = (lockHashes: string[]) => {
    const outputs: Output[] = this.tx.outputs!.map((output, index) => {
      const checkOutput = new CheckOutput(output)
      const result = checkOutput.checkLockHash(lockHashes)
      if (result) {
        if (output.type) {
          if (output.typeHash === this.daoTypeHash) {
            this.tx.outputs![index].setDaoData(this.tx.outputsData![index])
          }
        }
        return output
      }
      return false
    }).filter(output => !!output) as Output[]
    return outputs
  }

  public filterInputsOfWallets = async (lockHashes: string[]): Promise<string[]> => {
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
