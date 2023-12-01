import { desktopCapturer, screen, BrowserWindow, systemPreferences } from 'electron'
import { DeviceInfo, ExtendedPublicKey, PublicKey } from '../services/hardware/common'
import { ResponseCode } from '../utils/const'
import HardwareWalletService from '../services/hardware'
import { connectDeviceFailed, AskAccessFailed } from '../exceptions'
import { AccountExtendedPublicKey } from '../models/keys/key'

export default class HardwareController {
  public async connectDevice(deviceInfo: DeviceInfo): Promise<Controller.Response<void>> {
    const device = await HardwareWalletService.getInstance().initHardware(deviceInfo)
    try {
      await device!.connect()
    } catch (error) {
      throw new connectDeviceFailed(error.message)
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

  public async getFirmwareVersion(): Promise<Controller.Response<string>> {
    const device = HardwareWalletService.getInstance().getCurrent()!
    const version = await device.getFirmwareVersion?.()

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
    const defaultPath = AccountExtendedPublicKey.ckbAccountPath
    const pubkey = await device.getPublicKey(defaultPath)

    return {
      status: ResponseCode.Success,
      result: pubkey,
    }
  }

  public async askForCameraAccess() {
    const status = await systemPreferences.getMediaAccessStatus('camera')
    if (status === 'granted') {
      return {
        status: ResponseCode.Success,
      }
    }

    const canAccess = await systemPreferences.askForMediaAccess('camera')
    if (canAccess) {
      return {
        status: ResponseCode.Success,
      }
    }

    throw new AskAccessFailed()
  }

  public async captureScreen() {
    const status = await systemPreferences.getMediaAccessStatus('screen')
    if (status === 'denied') {
      throw new AskAccessFailed()
    }

    const currentWindow = BrowserWindow.getFocusedWindow()
    currentWindow?.hide()
    const display = screen.getPrimaryDisplay()
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        height: display.bounds.height * display.scaleFactor,
        width: display.bounds.width * display.scaleFactor,
      },
    })
    currentWindow?.show()
    const result = sources.map(item => ({
      id: item.id,
      name: item.name,
      dataUrl: item.thumbnail.toDataURL(),
    }))
    return {
      status: ResponseCode.Success,
      result,
    }
  }
}
