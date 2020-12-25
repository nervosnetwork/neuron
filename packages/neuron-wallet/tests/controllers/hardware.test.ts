import { Manufacturer } from '../../src/services/hardware/common'
import HardwareService from '../../src/services/hardware'
import HardwareController from '../../src/controllers/hardware'
import { ResponseCode } from '../../src/utils/const'
import { ledgerNanoS, LedgerNanoX, LedgerCkbApp } from '../mock/hardware'
import { connectDeviceFailed } from '../../src/exceptions'

describe('hardware controller', () => {
  const hardwareControler = new HardwareController()

  beforeEach(async () => {
    const device = await HardwareService.getInstance().initHardware(ledgerNanoS)
    await device.connect()
  })

  describe('connect device', () => {
    it('connect success', async () => {
      const result = await hardwareControler.connectDevice(ledgerNanoS)
      expect(result.status).toBe(ResponseCode.Success)
    })

    it('connect fail should throw connectDeviceFailed exception', async () => {
      try {
        await hardwareControler.connectDevice({
          ...ledgerNanoS,
          descriptor: '@throw me a error'
        })
      } catch (error) {
        expect(error).toEqual(new connectDeviceFailed())
      }
    })
  })

  it('#getCkbAppVersion', async () => {
    const { result } = await hardwareControler.getCkbAppVersion()
    expect(result).toBe(LedgerCkbApp.version)
   })

   it('#getPublicKey', async () => {
     const { result } = await hardwareControler.getPublicKey()
     expect(result!.publicKey).toBe(LedgerCkbApp.publicKey)
     expect(result!.chainCode).toBe(LedgerCkbApp.chainCode)
   })

   it('#detectDevice', async () => {
    const { result } = await hardwareControler.detectDevice({
      manufacturer: Manufacturer.Ledger,
      product: 'Nano X'
    })
    expect(result).toEqual([LedgerNanoX])
   })
})
