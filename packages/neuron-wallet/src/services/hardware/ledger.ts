import { DeviceInfo, ExtendedPublicKey } from './common'
import { Hardware } from './hardware'
import HID from '@ledgerhq/hw-transport-node-hid'
import LedgerCKB from 'hw-app-ckb'
import type { DescriptorEvent, Subscription, Observer } from '@ledgerhq/hw-transport'
import type Transport from '@ledgerhq/hw-transport'
import { Observable, timer } from 'rxjs'
import { takeUntil, filter, scan } from 'rxjs/operators'
import Transaction from '../../models/chain/transaction'
import NodeService from '../../services/node'
import Address, { AddressType } from '../../models/keys/address'
import HexUtils from '../../utils/hex'
import logger from '../../utils/logger'
import NetworksService from '../../services/networks'
import { generateRPC } from '../../utils/ckb-rpc'

export default class Ledger extends Hardware {
  private ledgerCKB: LedgerCKB | null = null
  private transport: Transport | null = null

  public async connect(deviceInfo?: DeviceInfo) {
    if (this.isConnected) {
      return
    }

    logger.info('Connect device:\t', deviceInfo ?? this.deviceInfo)

    this.deviceInfo = deviceInfo ?? this.deviceInfo
    this.transport = await HID.open(this.deviceInfo.descriptor)

    this.ledgerCKB = new LedgerCKB(this.transport)
    this.isConnected = true
  }

  public async disconnect() {
    if (!this.isConnected) {
      return
    }

    this.transport?.close()
    this.isConnected = false
  }

  public async getExtendedPublicKey(): Promise<ExtendedPublicKey> {
    const { public_key, chain_code } = await this.ledgerCKB!.getWalletExtendedPublicKey(this.defaultPath)
    return {
      publicKey: public_key,
      chainCode: chain_code,
    }
  }

  public async signTransaction(
    _: string,
    tx: Transaction,
    witnesses: string[],
    path: string,
    context?: RPC.RawTransaction[]
  ) {
    const rpc = generateRPC(NodeService.getInstance().nodeUrl)
    const rawTx = rpc.paramsFormatter.toRawTransaction(tx.toSDKRawTransaction())

    if (!context) {
      const txs = await Promise.all(rawTx.inputs.map(i => rpc.getTransaction(i.previous_output!.tx_hash)))
      context = txs.map(i => rpc.paramsFormatter.toRawTransaction(i.transaction))
    }

    const signature = await this.ledgerCKB!.signTransaction(
      path === Address.pathForReceiving(0) ? this.defaultPath : path,
      rawTx,
      witnesses,
      context,
      this.defaultPath
    )

    return signature
  }

  async signMessage(path: string, messageHex: string) {
    const message = HexUtils.removePrefix(messageHex)
    const signed = await this.ledgerCKB!.signMessage(
      path === Address.pathForReceiving(0) ? this.defaultPath : path,
      message,
      false
    )
    return HexUtils.addPrefix(signed)
  }

  async getAppVersion(): Promise<string> {
    const conf = await this.ledgerCKB?.getAppConfiguration()
    return conf!.version
  }

  async getFirmwareVersion(): Promise<string> {
    const res: Buffer = await this.transport!.send(0xe0, 0x01, 0x00, 0x00)!
    const byteArray = [...res]
    const data = byteArray.slice(0, byteArray.length - 2)
    const versionLength = data[4]
    const version = Buffer.from(data.slice(5, 5 + versionLength)).toString()

    return version
  }

  async getPublicKey(path: string) {
    const networkService = NetworksService.getInstance()
    const isTestnet = !networkService.isMainnet()
    const result = await this.ledgerCKB!.getWalletPublicKey(
      path === Address.pathForReceiving(0) ? this.defaultPath : path,
      isTestnet
    )
    return result
  }

  public static async findDevices() {
    const devices = await Promise.all([
      Ledger.searchDevices(HID.listen, false),
      // Ledger.searchDevices(Bluetooth.listen, true)
    ])

    return devices.flat()
  }

  private static async searchDevices(
    listener: (observer: Observer<DescriptorEvent<any>>) => Subscription,
    isBluetooth: boolean
  ) {
    return (
      new Observable(listener)
        .pipe(
          // searching for 2 seconds
          takeUntil(timer(2000)),
          filter<DescriptorEvent<any>>(e => e.type === 'add'),
          scan<DescriptorEvent<any>, DeviceInfo[]>((acc, e) => {
            return [
              ...acc,
              {
                isBluetooth,
                descriptor: e.descriptor,
                vendorId: e.device.vendorId,
                manufacturer: e.device.manufacturer,
                product: e.device.product,
                addressIndex: 0,
                addressType: AddressType.Receiving,
              },
            ]
          }, [])
        )
        .toPromise()
        // If the computer does not have Bluetooth support, ledgerjs may throw an error.
        .catch(() => [] as DeviceInfo[])
    )
  }
}
