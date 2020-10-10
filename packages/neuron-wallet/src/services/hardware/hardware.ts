import type Transaction from 'models/chain/transaction'
import WitnessArgs from 'models/chain/witness-args'
import { serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils'
import Address from 'models/keys/address'
import AddressService from 'services/addresses'
import TransactionSender from 'services/transaction-sender'
import MultiSign from 'models/multi-sign'
import WalletService from 'services/wallets'
import DeviceSignIndexSubject from 'models/subjects/device-sign-index-subject'
import type { DeviceInfo, ExtendedPublicKey } from './common'

export abstract class Hardware {
  public deviceInfo: DeviceInfo
  public isConnected: boolean
  protected firstReceiveAddress = Address.pathForReceiving(0)

  constructor(device: DeviceInfo) {
    this.deviceInfo = device
    this.isConnected = false
  }

  // @TODO: After multi-signature feature is complete, refactor this function into `TransactionSender#sign`.
  public async signTx (walletID: string, tx: Transaction, txHash: string, skipLastInputs: number = 0, context?: RPC.RawTransaction[]) {
    const wallet = WalletService.getInstance().get(walletID)
    const addressInfos = await AddressService.getAddressesByWalletId(walletID)
    const witnessSigningEntries = tx.inputs.slice(0, tx.inputs.length - skipLastInputs).map((input, index) => {
      const lockArgs: string = input.lock!.args!
      const wit: WitnessArgs | string = tx.witnesses[index]
      const witnessArgs: WitnessArgs = (wit instanceof WitnessArgs) ? wit : WitnessArgs.generateEmpty()
      return {
        witnessArgs,
        lockHash: input.lockHash!,
        witness: '',
        lockArgs,
      }
    })

    const isMultiSign = tx.inputs.length === 1 &&
      tx.inputs[0].lock!.args.length === TransactionSender.MULTI_SIGN_ARGS_LENGTH

    const multiSignBlake160s = isMultiSign ? addressInfos.map(i => {
      return {
        multiSignBlake160: new MultiSign().hash(i.blake160),
        path: i.path
      }
    }) : []

    const findPath = (args: string) => {
      if (args.length === TransactionSender.MULTI_SIGN_ARGS_LENGTH) {
        return multiSignBlake160s.find(i => args.slice(0, 42) === i.multiSignBlake160)!.path
      }
      return addressInfos.find(i => i.blake160 === args)!.path
    }

    const lockHashes = new Set(witnessSigningEntries.map(w => w.lockHash))

    for (const [index, lockHash] of [...lockHashes].entries()) {
      DeviceSignIndexSubject.next(index)
      const witnessesArgs = witnessSigningEntries.filter(w => w.lockHash === lockHash)
      // A 65-byte empty signature used as placeholder
      witnessesArgs[0].witnessArgs.setEmptyLock()

      const path = findPath(witnessesArgs[0].lockArgs)

      if (isMultiSign) {
        const serializedWitnesses = witnessesArgs.map(value => {
          const args = value.witnessArgs
          if (index === 0) {
            return args
          }
          if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
            return '0x'
          }
          return serializeWitnessArgs(args.toSDK())
        })
        const blake160 = addressInfos.find(i => witnessesArgs[0].lockArgs.slice(0, 42) === new MultiSign().hash(i.blake160))!.blake160
        const serializedMultiSign: string = new MultiSign().serialize(blake160)
        const witnesses = await TransactionSender.signSingleMultiSignScript(path, serializedWitnesses, txHash, serializedMultiSign, wallet)
        const signature = await this.signTransaction(
          walletID,
          tx,
          witnesses.map(w => typeof w === 'string' ? w : serializeWitnessArgs(w.toSDK())),
          path
        )
        const wit = witnesses[0] as WitnessArgs
        wit.lock = serializedMultiSign + signature
        witnesses[0] = serializeWitnessArgs(wit.toSDK())
        witnessesArgs[index].witness = witnesses[0]
        for (let i = 0; i < witnessesArgs.length; ++i) {
          witnessesArgs[i].witness = witnesses[i] as string
        }
      } else {
        const serializedWitnesses = witnessesArgs.map(value => {
          const args = value.witnessArgs
          if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
            return '0x'
          }
          return serializeWitnessArgs(args.toSDK())
        })
        const signture = await this.signTransaction(walletID, tx, serializedWitnesses, path, context)
        const witnessEntry = witnessSigningEntries.find(w => w.lockHash === lockHash)!
        witnessEntry.witness = serializeWitnessArgs({
          lock: '0x' + signture,
          inputType: witnessEntry.witnessArgs.inputType ?? '',
          outputType: ''
        })
      }
    }

    tx.witnesses = witnessSigningEntries.map(w => w.witness || '0x')
    tx.hash = txHash

    return tx
  }

  public abstract getExtendedPublicKey(): Promise<ExtendedPublicKey>
  public abstract connect(hardwareInfo?: DeviceInfo): Promise<void>
  public abstract signMessage(path: string, messageHex: string): Promise<string>
  public abstract disconnect(): Promise<void>
  public abstract getAppVersion(): Promise<string>
  public abstract getFirmwareVersion?(): Promise<string>
  public abstract signTransaction(
    walletID: string,
    tx: Transaction,
    witnesses: string[],
    path: string,
    context?: RPC.RawTransaction[]
  ): Promise<string>
}

export type HardwareClass = new (device: DeviceInfo) => Hardware
