import type Transaction from 'models/chain/transaction'
import WitnessArgs from 'models/chain/witness-args'
import { serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils'
import Address, { AddressType } from 'models/keys/address'
import AddressService from 'services/addresses'

export abstract class Hardware {
  public deviceInfo: DeviceInfo
  public isConnected: boolean
  protected firstReceiveAddress = Address.pathForReceiving(0)

  constructor(device: DeviceInfo) {
    this.deviceInfo = device
    this.isConnected = false
  }

  public async signTx (walletID: string, tx: Transaction, txHash: string, skipLastInputs: number = 0) {
    const addressInfos = await AddressService.getAddressesByWalletId(walletID)
    const findPath = (args: string) => {
      return addressInfos.find(i => i.blake160 === args)!.path
    }
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

    const lockHashes = new Set(witnessSigningEntries.map(w => w.lockHash))

    for (const [index, lockHash] of [...lockHashes].entries()) {
      const witnessesArgs = witnessSigningEntries.filter(w => w.lockHash === lockHash)
      // A 65-byte empty signature used as placeholder
      witnessesArgs[0].witnessArgs.setEmptyLock()

      const serializedWitnesses = witnessesArgs.map(value => {
        const args = value.witnessArgs
        if (args.lock === undefined && args.inputType === undefined && args.outputType === undefined) {
          return '0x'
        }
        return serializeWitnessArgs(args.toSDK())
      })

      const path = findPath(witnessesArgs[0].lockArgs)

      const signture = await this.signTransaction(walletID, tx, serializedWitnesses, path)

      witnessesArgs[index].witness = serializeWitnessArgs({
        lock: '0x' + signture,
        inputType: '',
        outputType: ''
      })
    }

    tx.witnesses = witnessSigningEntries.map(w => w.witness || '0x')
    tx.hash = txHash

    return tx
  }

  public abstract getExtendedPublicKey(): Promise<ExtendedPublicKey>
  public abstract connect(hardwareInfo?: DeviceInfo): Promise<void>
  public abstract signMessage(path: string, message: string): Promise<string>
  public abstract disconnect(): Promise<void>
  public abstract signTransaction(walletID: string, tx: Transaction, witnesses: string[], path: string): Promise<string>
  public abstract getAppVersion(): Promise<string>
  public abstract getFirmwareVersion?(): Promise<string>
}

export type HardwareClass = new (device: DeviceInfo) => Hardware

export enum Manufacturer {
  Ledger = 'Ledger'
}

export interface DeviceInfo {
  descriptor: string
  vendorId: string
  manufacturer: Manufacturer
  product: string
  isBluetooth: boolean
  // for single address
  addressType: AddressType
  addressIndex: number
  // The following information may or may not be available to us
  appVersion?: string
  firmwareVersion?: string
}

export interface ExtendedPublicKey {
  publicKey: string
  chainCode: string
}
