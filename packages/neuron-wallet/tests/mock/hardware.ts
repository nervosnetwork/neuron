import { DeviceInfo, Manufacturer } from '../../src/services/hardware'
import { AddressType } from '../../src/models/keys/address'
import type { Subscriber } from 'rxjs'

export const ledgerNanoS: DeviceInfo = {
  descriptor: '@LedgerNanoS',
  vendorId: '10086',
  product: 'Nano S',
  isBluetooth: false,
  manufacturer: Manufacturer.Ledger,
  addressType: AddressType.Receiving,
  addressIndex: 0
}

export const LedgerNanoX: DeviceInfo = {
  descriptor: '@LedgerNanoX',
  vendorId: '10087',
  product: 'Nano X',
  isBluetooth: true,
  manufacturer: Manufacturer.Ledger,
  addressType: AddressType.Receiving,
  addressIndex: 0
}

export class LedgerHID {
  static async open () {

  }

  static listen (subscriber: Subscriber<any>) {
    subscriber.next({
      type: 'add',
      descriptor: ledgerNanoS.descriptor,
      device: {
        manufacturer: ledgerNanoS.manufacturer,
        product: ledgerNanoS.product,
        vendorId: ledgerNanoS.vendorId,
      }
    })
  }
}

export class LedgerBLE {
  static async open () {

  }

  static listen (subscriber: Subscriber<any>) {
    subscriber.next({
      type: 'add',
      descriptor: LedgerNanoX.descriptor,
      device: {
        manufacturer: LedgerNanoX.manufacturer,
        product: LedgerNanoX.product,
        vendorId: LedgerNanoX.vendorId,
      }
    })
  }
}
