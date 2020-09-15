import { Hardware, DeviceInfo, ExtendedPublicKey } from './index'
import HID from '@ledgerhq/hw-transport-node-hid'
import type { DescriptorEvent, Descriptor } from '@ledgerhq/hw-transport'
import type Transport from '@ledgerhq/hw-transport'
import { Observable, timer } from 'rxjs'
import { takeUntil, filter, scan } from 'rxjs/operators'
import Bluetooth from '@ledgerhq/hw-transport-node-ble'
import LedgerCKB from 'hw-app-ckb'
import Transaction from 'models/chain/transaction'
import NodeService from 'services/node'
import { AddressType } from 'models/keys/address'

export default class Ledger extends Hardware {
  private isConnected = false
  private ledgerCKB: LedgerCKB | null = null
  private transport: Transport | null = null

  public init (device: DeviceInfo) {
    return new Ledger(device)
  }

  public async connect (deviceInfo?: DeviceInfo) {
    if (this.isConnected) {
      return
    }

    this.deviceInfo = deviceInfo ?? this.deviceInfo
    this.transport = this.deviceInfo.isBluetooth
      ? await Bluetooth.open(this.deviceInfo.descriptor)
      : await HID.open(this.deviceInfo.descriptor)

    this.ledgerCKB = new LedgerCKB(this.transport)
    this.isConnected = true
  }

  public async disconnect () {
    if (!this.isConnected) {
      return
    }

    this.transport?.close()
    if (this.deviceInfo.isBluetooth) {
      await Bluetooth.disconnect(this.deviceInfo.descriptor)
    }
    this.isConnected = false
  }

  public async getExtendedPublicKey (): Promise<ExtendedPublicKey> {
    const { public_key, chain_code } = await this.ledgerCKB!.getWalletExtendedPublicKey(this.firstReceiveAddress)
    return {
      publicKey: public_key,
      chainCode: chain_code
    }
  }

  public async signTransaction (_: string, tx: Transaction) {
    const { ckb } = NodeService.getInstance()
    const rawTx = ckb.rpc.paramsFormatter.toRawTransaction(tx.toSDKRawTransaction())
    rawTx.witnesses = rawTx.inputs.map(() => '0x')
    rawTx.witnesses[0] = ckb.utils.serializeWitnessArgs({
      lock: '',
      inputType: '',
      outputType: ''
    })
    const txs = await Promise.all(rawTx.inputs.map(i => ckb.rpc.getTransaction(i.previous_output!.tx_hash)))
    const txContext = txs.map(i => ckb.rpc.paramsFormatter.toRawTransaction(i.transaction))
    const signature = await this.ledgerCKB!.signTransaction(
      this.firstReceiveAddress,
      rawTx,
      rawTx.witnesses,
      txContext,
      this.firstReceiveAddress,
    )

    tx.witnesses[0] = ckb.utils.serializeWitnessArgs({
      lock: '0x' + signature,
      inputType: '',
      outputType: ''
    })

    tx.hash = tx.computeHash()

    return tx
  }

  async signMessage (path: string, message: string) {
    const messageHex = Buffer.from(message, 'utf-8').toString('hex')
    return await this.ledgerCKB!.signMessage(path, messageHex, true)
  }

  async getAppVersion (): Promise<string> {
    const conf = await this.ledgerCKB?.getAppConfiguration()
    return conf!.version
  }

  async getFirmwareVersion (): Promise<string> {
    let res: Buffer = await this.transport!.send(0xe0, 0x01, 0x00, 0x00)!
    const byteArray = [...res]
    const data = byteArray.slice(0, byteArray.length - 2)
    const versionLength = data[4]
    const version = Buffer.from(data.slice(5, 5 + versionLength)).toString()

    return version
  }

  public static async findDevices () {
    const devices = await Promise.all([
      Ledger.searchDevices(HID.listen, false),
      Ledger.searchDevices(Bluetooth.listen, true)
    ])

    return devices.flat()
  }

  private static async searchDevices (listener: any, isBluetooth: boolean) {
    return new Observable(listener)
      .pipe(
        // searching for 2 seconds
        takeUntil(timer(2000)),
        filter<DescriptorEvent<Descriptor>>(e => e.type === 'add'),
        scan<DescriptorEvent<Descriptor>, DeviceInfo[]>((acc, e) => {
            return [
              ...acc,
              {
                isBluetooth,
                descriptor: e.descriptor,
                vendorId: e.device.vendorId,
                manufacturer: e.device.manufacturer,
                product: e.device.product,
                addressIndex: 0,
                addressType: AddressType.Receiving
              }
            ]
          }, []),
        )
      .toPromise()
  }
}
