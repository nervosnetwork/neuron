import { Manufacturer } from '../../src/services/hardware/common'
import HardwareService from '../../src/services/hardware'
import HardwareController from '../../src/controllers/hardware'
import { ResponseCode } from '../../src/utils/const'
import { ledgerNanoS, LedgerCkbApp } from '../mock/hardware'
import { connectDeviceFailed } from '../../src/exceptions'

describe('hardware controller', () => {
  const hardwareController = new HardwareController()

  beforeEach(async () => {
    const device = await HardwareService.getInstance().initHardware(ledgerNanoS)
    await device.connect()
  })

  describe('connect device', () => {
    it('connect success', async () => {
      const result = await hardwareController.connectDevice(ledgerNanoS)
      expect(result.status).toBe(ResponseCode.Success)
    })

    it('connect fail should throw connectDeviceFailed exception', async () => {
      try {
        await hardwareController.connectDevice({
          ...ledgerNanoS,
          descriptor: '@throw me a error',
        })
      } catch (error) {
        expect(error).toEqual(new connectDeviceFailed())
      }
    })
  })

  it('#getCkbAppVersion', async () => {
    const { result } = await hardwareController.getCkbAppVersion()
    expect(result).toBe(LedgerCkbApp.version)
  })

  it('#getPublicKey', async () => {
    const { result } = await hardwareController.getPublicKey()
    expect(result!.publicKey).toBe(LedgerCkbApp.publicKey)
    expect(result!.lockArg).toBe(LedgerCkbApp.lockArg)
    expect(result!.address).toBe(LedgerCkbApp.address)
  })

  it('#getExtendedPublicKey', async () => {
    const { result } = await hardwareController.getExtendedPublicKey()
    expect(result!.publicKey).toBe(LedgerCkbApp.publicKey)
    expect(result!.chainCode).toBe(LedgerCkbApp.chainCode)
  })

  it('#detectDevice', async () => {
    const { result } = await hardwareController.detectDevice({
      manufacturer: Manufacturer.Ledger,
      product: 'Nano S',
    })
    expect(result).toEqual([ledgerNanoS])
  })
})
