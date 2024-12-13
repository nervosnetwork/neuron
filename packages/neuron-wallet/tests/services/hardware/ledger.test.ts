import Ledger from '../../../src/services/hardware/ledger'

const getWalletExtendedPublicKeyMock = jest.fn()

jest.mock('@magickbase/hw-app-ckb', () => {
  return function () {
    return {
      getWalletExtendedPublicKey: getWalletExtendedPublicKeyMock,
    }
  }
})

jest.mock('@ledgerhq/hw-transport-node-hid', () => ({
  open: jest.fn(),
}))

const pk =
  '04d061e9c5891f579fd548cfd22ff29f5c642714cc7e7a9215f0071ef5a5723f691757b28e31be71f09f24673eed52348e58d53bcfd26f4d96ec6bf1489eab429d'
const zipPk = '03d061e9c5891f579fd548cfd22ff29f5c642714cc7e7a9215f0071ef5a5723f69'

describe('test for ledger', () => {
  describe('test getExtendedPublicKey', () => {
    it('if the return pk is unzip', async () => {
      getWalletExtendedPublicKeyMock.mockResolvedValueOnce({ public_key: pk, chain_code: '0x' })
      const ledger = new Ledger({} as any)
      await ledger.connect()
      const res = await ledger.getExtendedPublicKey()
      expect(res.publicKey).toBe(zipPk)
    })

    it('if the return pk is zip', async () => {
      getWalletExtendedPublicKeyMock.mockResolvedValueOnce({ public_key: zipPk, chain_code: '0x' })
      const ledger = new Ledger({} as any)
      await ledger.connect()
      const res = await ledger.getExtendedPublicKey()
      expect(res.publicKey).toBe(zipPk)
    })
  })
})
