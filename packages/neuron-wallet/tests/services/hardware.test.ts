import { Manufacturer } from '../../src/services/hardware/common'
import HardwareService from '../../src/services/hardware'
import { ledgerNanoS } from '../mock/hardware'

describe('HardwareWalletService', () => {
  describe('service', () => {
    describe('findDevice', () => {
      it('find all kind of device', async () => {
        const devices = await HardwareService.findDevices()
        expect(devices).toEqual([ledgerNanoS])
      })

      it('find specific model device', async () => {
        const devices = await HardwareService.findDevices({
          manufacturer: Manufacturer.Ledger,
          product: 'Nano S'
        })
        expect(devices).toEqual([ledgerNanoS])
      })

      it.skip('can find bluetooth model', async () => {
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
})
