import { Hardware, DeviceInfo } from './index'
import { AccountExtendedPublicKey } from 'models/keys/key'
import HID from '@ledgerhq/hw-transport-node-hid'
import type { DescriptorEvent, Descriptor } from '@ledgerhq/hw-transport'
import type Transport from '@ledgerhq/hw-transport'
import { Observable, timer } from 'rxjs'
import { takeUntil, filter, scan } from 'rxjs/operators'
import Bluetooth from '@ledgerhq/hw-transport-node-ble'
import LedgerCKB from 'hw-app-ckb'

export default class Ledger implements Hardware {
  public deviceInfo: DeviceInfo
  private isBluetooth = false
  private ledgerCKB: LedgerCKB | null = null

  constructor (deviceInfo: DeviceInfo) {
    this.deviceInfo = deviceInfo
  }

  public async connect (deviceInfo?: DeviceInfo) {
    this.deviceInfo = deviceInfo ?? this.deviceInfo
    const transport: Transport = this.deviceInfo.isBluetooth
      ? await Bluetooth.open(this.deviceInfo.descriptor)
      : await HID.open(this.deviceInfo.descriptor)

    this.ledgerCKB = new LedgerCKB(transport)
  }

  // for ledger, we can only close bluetooth connection manually
  public async disconect () {
    if (this.isBluetooth) {
      await Bluetooth.disconnect(this.deviceInfo.descriptor)
    }
  }

  public async getExtendedPublicKey () {
    const { public_key, chain_code } = await this.ledgerCKB!.getWalletExtendedPublicKey(AccountExtendedPublicKey.ckbAccountPath)
    return {
      publicKey: public_key,
      chainCode: chain_code
    }
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
              }
            ]
          }, []),
        )
      .toPromise()
  }
}
