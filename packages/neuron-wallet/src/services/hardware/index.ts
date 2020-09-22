import { UnsupportedManufacturer } from 'exceptions'
import { DeviceInfo, Manufacturer } from './common'
import Ledger from './ledger'
import { Hardware, HardwareClass } from './hardware'

export default class HardwareWalletService {
  private static instance: HardwareWalletService
  private device?: Hardware
  private supportedHardwares: Map<Manufacturer, HardwareClass> = new Map()

  constructor () {
    this.supportedHardwares.set(Manufacturer.Ledger, Ledger)
  }

  public static getInstance = () => {
    if (HardwareWalletService.instance === undefined) {
      HardwareWalletService.instance = new HardwareWalletService()
    }

    return HardwareWalletService.instance
  }

  public getCurrent () {
    return this.device
  }

  public async initHardware (deviceInfo: DeviceInfo) {
    const Device = this.supportedHardwares.get(deviceInfo.manufacturer)
    if (!Device) {
      throw new UnsupportedManufacturer(deviceInfo.manufacturer)
    }

    if (this.device?.deviceInfo.descriptor === deviceInfo.descriptor) {
      await this.device.disconnect()
      return this.device!
    }

    this.device = new Device(deviceInfo)
    return this.device
  }

  public static async findDevices (device?: Pick<DeviceInfo, 'manufacturer' | 'product'>): Promise<DeviceInfo[]> {
    const devices = await Promise.all([
      Ledger.findDevices(),
      // add new brand `findDevices()` here
    ])
    const result = devices.flat().filter(Boolean)

    if (device) {
      return result.filter(r => r.manufacturer === device.manufacturer && r.product === device.product)
    }

    return result
  }
}
