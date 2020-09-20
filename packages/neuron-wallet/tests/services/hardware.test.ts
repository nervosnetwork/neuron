import { Manufacturer } from '../../src/services/hardware/common'
import HardwareService from '../../src/services/hardware'
import HardwareController from '../../src/controllers/hardware'
import { ResponseCode } from '../../src/utils/const'
import { ledgerNanoS, LedgerNanoX, LedgerCkbApp } from '../mock/hardware'
import { connectDeviceFailed } from '../../src/exceptions'

describe('HardwareWalletService', () => {
  describe('service', () => {
    describe('findDevice', () => {
      it('find all kind of device', async () => {
        const devices = await HardwareService.findDevices()
        expect(devices).toEqual([ledgerNanoS, LedgerNanoX])
      })

      it('find specific model device', async () => {
        const devices = await HardwareService.findDevices({
          manufacturer: Manufacturer.Ledger,
          product: 'Nano S'
        })
        expect(devices).toEqual([ledgerNanoS])
      })

      it('can find bluetooth model', async () => {
        const devices = await HardwareService.findDevices()
        expect(devices.some(d => d.isBluetooth)).toBe(true)
      })
    })

    describe('#initHardware', () => {
      it('init unsupported hardware should throw error', async () => {
        const manufacturer = 'Unknown'
        try {
          await HardwareService.getInstance().initHardware({
            ...ledgerNanoS,
            manufacturer,
          } as any)
        } catch (error) {
          expect(error.message).toBe(`Devices from ${manufacturer} are not yet supported.`)
        }
      })

      it('init properly', async () => {
        const device = await HardwareService.getInstance().initHardware(ledgerNanoS)
        expect(device.deviceInfo).toEqual(ledgerNanoS)
      })

      it('mutilple init should disconect device', async () => {
        const device = await HardwareService.getInstance().initHardware(ledgerNanoS)
        await HardwareService.getInstance().initHardware(ledgerNanoS)
        expect(device.isConnected).toBe(false)
      })
    })

    describe('#getCurrent', () => {
      it('should get current device properly', async () => {
        await HardwareService.getInstance().initHardware(ledgerNanoS)
        const device = HardwareService.getInstance().getCurrent()!
        expect(device.deviceInfo).toEqual(ledgerNanoS)
      })
    })
  })

  describe('controller', () => {
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
})

