import { Hardware, DeviceInfo, Manufacturer, HardwareResponse } from './hardware'
import Ledger from './hardware/ledger'
import { ResponseCode } from 'utils/const'

export default class HardwareWalletService {
  private static instance: HardwareWalletService
  private device?: Hardware

  public static getInstance = () => {
    if (HardwareWalletService.instance === undefined) {
      HardwareWalletService.instance = new HardwareWalletService()
    }

    return HardwareWalletService.instance
  }

  public getCurrent () {
    return this.device
  }

  public async initHardware (device: DeviceInfo) {
    switch (device.manufacturer) {
      case Manufacturer.Ledger: {
        if (this.device?.deviceInfo.descriptor === device.descriptor) {
          await this.device.disconect()
          return this.device!
        }
        const hardware = new Ledger(device)
        this.device = hardware
        return hardware
      }
      default:
        return null
    }
  }

  public static async findDevices (device?: DeviceInfo): Promise<HardwareResponse<DeviceInfo[]>> {
    try {
      const devices = await Promise.all([
        Ledger.findDevices(),
        // add new brand `findDevices()` here
      ])
      let result = devices.flat().filter(Boolean)

      if (device) {
        result = result.filter(r => r.manufacturer === device.manufacturer && r.product === device.product)
      }

      return {
        status: ResponseCode.Success,
        result
      }
    } catch (error) {
      return {
        status: ResponseCode.Fail,
        message: error
      }
    }
  }
}
