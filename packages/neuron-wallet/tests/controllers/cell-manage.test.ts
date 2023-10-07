import CellManage from '../../src/controllers/cell-manage'
import { outPointTransformer } from '../../src/database/chain/entities/cell-local-info'
import { AddressNotFound, CurrentWalletNotSet } from '../../src/exceptions'
import OutPoint from '../../src/models/chain/out-point'
import Output from '../../src/models/chain/output'
import { ScriptHashType } from '../../src/models/chain/script'
import { scriptToAddress } from '../../src/utils/scriptAndAddress'

const getCurrentWalletMock = jest.fn()
const getLiveCellsMock = jest.fn()
const getCellLocalInfoMapMock = jest.fn()
const getCellLockTypeMock = jest.fn()
const getCellTypeTypeMock = jest.fn()
const isMainnetMock = jest.fn()
const getAddressesByWalletIdMock = jest.fn()
const updateLiveCellLockStatusMock = jest.fn()
const signMock = jest.fn()
const getLockedCellsMock = jest.fn()

function resetMocks() {
  getCurrentWalletMock.mockReset()
  getLiveCellsMock.mockReset()
  getCellLocalInfoMapMock.mockReset()
  isMainnetMock.mockReset()
  getAddressesByWalletIdMock.mockReset()
  updateLiveCellLockStatusMock.mockReset()
  signMock.mockReset()
  getLockedCellsMock.mockReset()
}

jest.mock('../../src/services/wallets', () => ({
  getInstance() {
    return {
      getCurrent: getCurrentWalletMock,
    }
  },
}))

jest.mock('../../src/services/networks', () => ({
  getInstance() {
    return {
      isMainnet: isMainnetMock,
    }
  },
}))

jest.mock('../../src/services/cells', () => ({
  getLiveCells: () => getLiveCellsMock(),
  getCellLockType: () => getCellLockTypeMock,
  getCellTypeType: () => getCellTypeTypeMock(),
}))

jest.mock('../../src/services/addresses', () => ({
  getAddressesByWalletId: () => getAddressesByWalletIdMock(),
}))

jest.mock('../../src/services/sign-message', () => ({
  sign: (walletID: string, address: string, password: string, message: string) =>
    signMock(walletID, address, password, message),
}))

jest.mock('../../src/services/cell-local-info', () => ({
  getCellLocalInfoMap: (outPoints: CKBComponents.OutPoint[]) => getCellLocalInfoMapMock(outPoints),
  updateLiveCellLockStatus: (outPoints: CKBComponents.OutPoint[], locked: boolean) =>
    updateLiveCellLockStatusMock(outPoints, locked),
  getLockedCells: () => getLockedCellsMock(),
}))

const secp256k1CodeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
function createOutput(
  capacity: string = '6100000000',
  lockArgs: string = '0x36c329ed630d6ce750712a477543672adab57f4c'
) {
  return Output.fromSDK({
    capacity,
    lock: {
      codeHash: secp256k1CodeHash,
      hashType: ScriptHashType.Type,
      args: lockArgs,
    },
  })
}
describe('CellManage', () => {
  beforeEach(() => {
    resetMocks()
  })
  describe('getLiveCells', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManage.getLiveCells()).rejects.toThrow(new CurrentWalletNotSet())
    })
    it('outpoint is null', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLiveCellsMock.mockResolvedValueOnce([createOutput()])
      await CellManage.getLiveCells()
      expect(getCellLocalInfoMapMock).toBeCalledWith([])
    })
    it('outpoint is null and order by timestamp', async () => {
      const output1 = createOutput()
      output1.timestamp = '12'
      const output2 = createOutput()
      output2.timestamp = '13'
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLiveCellsMock.mockResolvedValueOnce([output1, output2])
      const res = await CellManage.getLiveCells()
      expect(getCellLocalInfoMapMock).toBeCalledWith([])
      expect(res[0].timestamp).toBe(output2.timestamp)
    })
    it('outpoint is not null', async () => {
      const output1 = createOutput()
      output1.timestamp = '12'
      output1.outPoint = new OutPoint(`0x${'00'.repeat(32)}`, '0')
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLiveCellsMock.mockResolvedValueOnce([output1])
      getCellLocalInfoMapMock.mockResolvedValueOnce({
        [outPointTransformer.to(output1.outPoint)]: { description: 'description', locked: true },
      })
      const res = await CellManage.getLiveCells()
      expect(res[0].description).toBe('description')
      expect(res[0].locked).toBeTruthy()
    })
  })

  describe('updateLiveCellsLockStatus', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManage.updateLiveCellsLockStatus([], true, [], '')).rejects.toThrow(new CurrentWalletNotSet())
    })
    it('address not found', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getAddressesByWalletIdMock.mockResolvedValueOnce([])
      await expect(
        CellManage.updateLiveCellsLockStatus(
          [],
          true,
          [
            {
              codeHash: secp256k1CodeHash,
              hashType: ScriptHashType.Type,
              args: `0x${'0'.repeat(40)}`,
            },
          ],
          ''
        )
      ).rejects.toThrow(new AddressNotFound())
    })
    it('update success', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      isMainnetMock.mockReturnValue(false)
      const lockScript = { codeHash: secp256k1CodeHash, hashType: ScriptHashType.Type, args: `0x${'0'.repeat(40)}` }
      const address = scriptToAddress(lockScript, false)
      getAddressesByWalletIdMock.mockResolvedValueOnce([{ address }])
      const outPoints = [new OutPoint(`0x${'00'.repeat(32)}`, '0')]
      await CellManage.updateLiveCellsLockStatus(outPoints, true, [lockScript], 'password')
      expect(signMock).toBeCalledWith('walletId1', address, 'password', 'verify password')
      expect(updateLiveCellLockStatusMock).toBeCalledWith(outPoints, true)
    })
  })

  describe('getLockedBalance', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManage.getLockedBalance()).rejects.toThrow(new CurrentWalletNotSet())
    })
    it('success', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLockedCellsMock.mockResolvedValueOnce([{ capacity: '6100000000' }, { capacity: '6100000000' }])
      expect(await CellManage.getLockedBalance()).toBe('12200000000')
    })
  })
})
