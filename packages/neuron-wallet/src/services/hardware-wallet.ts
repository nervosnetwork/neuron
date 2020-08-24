import { Hardware, DeviceInfo, Manufacturer } from './hardware'
import Ledger from './hardware/ledger'

type Descriptor = string

export default class HardwareWalletService {
  private static instance: HardwareWalletService
  private hardwares: Map<Descriptor, Hardware> = new Map()
  private descriptor: string = ''

  public static getInstance = () => {
    if (HardwareWalletService.instance === undefined) {
      HardwareWalletService.instance = new HardwareWalletService()
    }

    return HardwareWalletService.instance
  }

  public getCurrentHardware () {
    return this.getHardware(this.descriptor)
  }

  public async initHardware (device: DeviceInfo) {
    switch (device.manufacturer) {
      case Manufacturer.Ledger: {
        const hardware = new Ledger(device)
        this.hardwares.set(device.descriptor, hardware)
        break
      }
      default:
        break
    }
  }

  public getHardware (descriptor: string) {
    return this.hardwares.get(descriptor)
  }

  public static async findDevices (): Promise<DeviceInfo[]> {
    const devices = await Promise.all([
      Ledger.findDevices(),
      // add new brand `findDevices()` here
    ])

    return devices.flat()
  }
}
