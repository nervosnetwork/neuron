import { DeviceInfo } from '../../src/services/hardware/common'
import { hd } from '@ckb-lumos/lumos'
import type { Subscriber } from 'rxjs'

enum Manufacturer {
  Ledger = 'Ledger',
}

export const ledgerNanoS: DeviceInfo = {
  descriptor: '@LedgerNanoS',
  vendorId: '10086',
  product: 'Nano S',
  isBluetooth: false,
  manufacturer: Manufacturer.Ledger,
  addressType: hd.AddressType.Receiving,
  addressIndex: 0,
}

export const LedgerNanoX: DeviceInfo = {
  descriptor: '@LedgerNanoX',
  vendorId: '10087',
  product: 'Nano X',
  isBluetooth: true,
  manufacturer: Manufacturer.Ledger,
  addressType: hd.AddressType.Receiving,
  addressIndex: 0,
}

class LedgerTransport {
  send() {}

  close() {}
}

export class LedgerHID {
  static async open(descriptor: string) {
    if (descriptor !== ledgerNanoS.descriptor && descriptor !== LedgerNanoX.descriptor) {
      throw new Error('')
    }

    return new LedgerTransport()
  }

  static listen(subscriber: Subscriber<any>) {
    subscriber.next({
      type: 'add',
      descriptor: ledgerNanoS.descriptor,
      device: {
        manufacturer: ledgerNanoS.manufacturer,
        product: ledgerNanoS.product,
        vendorId: ledgerNanoS.vendorId,
      },
    })
  }
}

export class LedgerBLE {
  static async open(descriptor: string) {
    if (descriptor !== ledgerNanoS.descriptor || descriptor !== LedgerNanoX.descriptor) {
      throw new Error('')
    }

    return new LedgerTransport()
  }

  static listen(subscriber: Subscriber<any>) {
    subscriber.next({
      type: 'add',
      descriptor: LedgerNanoX.descriptor,
      device: {
        manufacturer: LedgerNanoX.manufacturer,
        product: LedgerNanoX.product,
        vendorId: LedgerNanoX.vendorId,
      },
    })
  }
}

export class LedgerCkbApp {
  public static publicKey = 'publicKey'
  public static chainCode = 'chain_code'
  public static version = '0.4.0'
  public static lockArg = 'args'
  public static address = 'address'

  async getWalletPublicKey() {
    return {
      publicKey: LedgerCkbApp.publicKey,
      lockArg: LedgerCkbApp.lockArg,
      address: LedgerCkbApp.address,
    }
  }

  async getWalletExtendedPublicKey() {
    return {
      public_key: LedgerCkbApp.publicKey,
      chain_code: LedgerCkbApp.chainCode,
    }
  }

  async getAppConfiguration() {
    return {
      version: LedgerCkbApp.version,
    }
  }
}
