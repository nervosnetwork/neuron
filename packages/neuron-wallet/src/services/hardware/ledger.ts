import { DeviceInfo, ExtendedPublicKey } from './common'
import { Hardware } from './hardware'
import HID from '@ledgerhq/hw-transport-node-hid'
import LedgerCKB from 'hw-app-ckb'
import type { DescriptorEvent, Subscription, Observer } from '@ledgerhq/hw-transport'
import type Transport from '@ledgerhq/hw-transport'
import { Observable, timer } from 'rxjs'
import { takeUntil, filter, scan } from 'rxjs/operators'
import Transaction from '../../models/chain/transaction'
import { hd } from '@ckb-lumos/lumos'
import logger from '../../utils/logger'
import NetworksService from '../../services/networks'
import { generateRPC } from '../../utils/ckb-rpc'

const UNCOMPRESSED_KEY_LENGTH = 130
const compressPublicKey = (key: string) => {
  if (key.length !== UNCOMPRESSED_KEY_LENGTH) {
    return key
  }

  const publicKey = Buffer.from(key, 'hex')
  const compressedPublicKey = Buffer.alloc(33)
    // '03' for odd value, '02' for even value
    .fill(publicKey[64] & 1 ? '03' : '02', 0, 1, 'hex')
    .fill(publicKey.subarray(1, 33), 1, 33)
  return compressedPublicKey.toString('hex')
}

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
    // The ledger wallet's public key is unzipped, so zip it to 33 bytes https://en.bitcoin.it/wiki/BIP_0032 serializes the coordinate pair P
    return {
      publicKey: compressPublicKey(public_key),
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
    const currentNetwork = NetworksService.getInstance().getCurrent()
    const rpc = generateRPC(currentNetwork.remote, currentNetwork.type)
    const rawTx = rpc.paramsFormatter.toRawTransaction(tx.toSDKRawTransaction())

    if (!context) {
      const txs = await Promise.all(rawTx.inputs.map(i => rpc.getTransaction(i.previous_output!.tx_hash)))
      context = txs.map(i => rpc.paramsFormatter.toRawTransaction(i.transaction))
    }

    const signature = await this.ledgerCKB!.signTransaction(
      path === hd.AccountExtendedPublicKey.pathForReceiving(0) ? this.defaultPath : path,
      rawTx,
      witnesses,
      context,
      this.defaultPath
    )

    return signature
  }

  async signMessage(path: string, messageHex: string) {
    const message = this.removePrefix(messageHex)
    const signed = await this.ledgerCKB!.signMessage(
      path === hd.AccountExtendedPublicKey.pathForReceiving(0) ? this.defaultPath : path,
      message,
      false
    )
    return this.addPrefix(signed)
  }

  async getAppVersion(): Promise<string> {
    const conf = await this.ledgerCKB?.getAppConfiguration()
    return conf!.version
  }

  async getPublicKey(path: string) {
    const networkService = NetworksService.getInstance()
    const isTestnet = !networkService.isMainnet()
    const result = await this.ledgerCKB!.getWalletPublicKey(
      path === hd.AccountExtendedPublicKey.pathForReceiving(0) ? this.defaultPath : path,
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
                addressType: hd.AddressType.Receiving,
              },
            ]
          }, [])
        )
        .toPromise()
        // If the computer does not have Bluetooth support, ledgerjs may throw an error.
        .catch(() => [] as DeviceInfo[])
    )
  }

  private removePrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex.slice(2)
    }
    return hex
  }

  private addPrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex
    }
    return `0x${hex}`
  }
}
