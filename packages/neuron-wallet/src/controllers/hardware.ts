import { DeviceInfo, ExtendedPublicKey, PublicKey } from '../services/hardware/common'
import { ResponseCode } from '../utils/const'
import HardwareWalletService from '../services/hardware'
import WalletService from '../services/wallets'
import { connectDeviceFailed, DeviceNotMatchWallet } from '../exceptions'
import { hd } from '@ckb-lumos/lumos'

export default class HardwareController {
  public async connectDevice(params: DeviceInfo & { walletID?: string }): Promise<Controller.Response<void>> {
    const { walletID, ...deviceInfo } = params
    const device = await HardwareWalletService.getInstance().initHardware(deviceInfo)
    try {
      await device!.connect()
    } catch (error) {
      throw new connectDeviceFailed(error.message)
    }

    if (walletID) {
      const walletPK = WalletService.getInstance().get(walletID).accountExtendedPublicKey()
      const devicePK = await device.getExtendedPublicKey()
      if (!walletPK.publicKey.includes(devicePK.publicKey)) {
        throw new DeviceNotMatchWallet()
      }
    }

    return {
      status: ResponseCode.Success,
    }
  }

  public async detectDevice(
    model: Pick<DeviceInfo, 'manufacturer' | 'product'>
  ): Promise<Controller.Response<DeviceInfo[]>> {
    const devices = await HardwareWalletService.findDevices(model)
    return {
      status: ResponseCode.Success,
      result: devices,
    }
  }

  public async getCkbAppVersion(): Promise<Controller.Response<string>> {
    const device = HardwareWalletService.getInstance().getCurrent()!
    const version = await device.getAppVersion()

    return {
      status: ResponseCode.Success,
      result: version,
    }
  }

  public async getExtendedPublicKey(): Promise<Controller.Response<ExtendedPublicKey>> {
    const device = HardwareWalletService.getInstance().getCurrent()!
    const pubkey = await device.getExtendedPublicKey()

    return {
      status: ResponseCode.Success,
      result: pubkey,
    }
  }

  public async getPublicKey(): Promise<Controller.Response<PublicKey>> {
    const device = HardwareWalletService.getInstance().getCurrent()!
    const defaultPath = hd.AccountExtendedPublicKey.ckbAccountPath
    const pubkey = await device.getPublicKey(defaultPath)

    return {
      status: ResponseCode.Success,
      result: pubkey,
    }
  }
}
