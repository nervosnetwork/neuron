import type { OutPoint as OutPointSDK } from '@ckb-lumos/lumos'
import CellManagement from '../../src/controllers/cell-management'
import CellLocalInfo from '../../src/database/chain/entities/cell-local-info'
import { AddressNotFound, CurrentWalletNotSet } from '../../src/exceptions'
import OutPoint from '../../src/models/chain/out-point'
import OutputEntity from '../../src/database/chain/entities/output'
import { ScriptHashType } from '../../src/models/chain/script'
import { scriptToAddress } from '../../src/utils/scriptAndAddress'
import Transaction from '../../src/database/chain/entities/transaction'

const getCurrentWalletMock = jest.fn()
const getLiveOrSentCellByWalletIdMock = jest.fn()
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
  getLiveOrSentCellByWalletIdMock.mockReset()
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
  getLiveOrSentCellByWalletId: () => getLiveOrSentCellByWalletIdMock(),
  getCellLockType: () => getCellLockTypeMock,
  getCellTypeType: () => getCellTypeTypeMock(),
}))

jest.mock('../../src/services/addresses', () => ({
  getAddressesByWalletId: () => getAddressesByWalletIdMock(),
}))

jest.mock('../../src/services/sign-message', () => ({
  sign: (params: { walletID: string; address?: string; password: string; message: string }) => signMock(params),
}))

jest.mock('../../src/services/cell-local-info', () => ({
  getCellLocalInfoMap: (outPoints: OutPointSDK[]) => getCellLocalInfoMapMock(outPoints),
  updateLiveCellLockStatus: (outPoints: OutPointSDK[], locked: boolean) =>
    updateLiveCellLockStatusMock(outPoints, locked),
  getLockedCells: () => getLockedCellsMock(),
}))

const secp256k1CodeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
function createOutput(
  capacity: string = '6100000000',
  lockArgs: string = '0x36c329ed630d6ce750712a477543672adab57f4c'
) {
  const output = new OutputEntity()
  output.capacity = capacity
  output.lockArgs = lockArgs
  output.lockCodeHash = secp256k1CodeHash
  output.lockHashType = ScriptHashType.Type
  output.outPointTxHash = `0x${'00'.repeat(32)}`
  output.outPointIndex = '0'
  output.transaction = new Transaction()
  return output
}
describe('CellManage', () => {
  beforeEach(() => {
    resetMocks()
  })
  describe('getLiveCells', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManagement.getLiveCells()).rejects.toThrow(new CurrentWalletNotSet())
    })
    it('outpoint is not null and order by timestamp', async () => {
      const output1 = createOutput()
      output1.transaction.timestamp = '12'
      const output2 = createOutput()
      output2.transaction.timestamp = '13'
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLiveOrSentCellByWalletIdMock.mockResolvedValueOnce([output1, output2])
      getCellLocalInfoMapMock.mockResolvedValueOnce({})
      const res = await CellManagement.getLiveCells()
      expect(getCellLocalInfoMapMock).toBeCalledWith([
        { txHash: output1.outPointTxHash, index: output1.outPointIndex },
        { txHash: output2.outPointTxHash, index: output2.outPointIndex },
      ])
      expect(res[0].timestamp).toBe(output2.transaction.timestamp)
    })
    it('outpoint is not null', async () => {
      const output1 = createOutput()
      output1.outPointTxHash = `0x${'01'.repeat(32)}`
      output1.outPointIndex = '0'
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLiveOrSentCellByWalletIdMock.mockResolvedValueOnce([output1])
      getCellLocalInfoMapMock.mockResolvedValueOnce({
        [CellLocalInfo.getKey(output1.outPoint())]: { description: 'description', locked: true },
      })
      const res = await CellManagement.getLiveCells()
      expect(res[0].description).toBe('description')
      expect(res[0].locked).toBeTruthy()
    })
  })

  describe('updateLiveCellsLockStatus', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManagement.updateLiveCellsLockStatus([], true, [], '')).rejects.toThrow(
        new CurrentWalletNotSet()
      )
    })
    it('address not found', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getAddressesByWalletIdMock.mockResolvedValueOnce([])
      await expect(
        CellManagement.updateLiveCellsLockStatus(
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
      await CellManagement.updateLiveCellsLockStatus(outPoints, true, [lockScript], 'password')
      expect(signMock).toBeCalledWith({
        walletID: 'walletId1',
        password: 'password',
        message: 'verify cell owner',
        address,
      })
      expect(updateLiveCellLockStatusMock).toBeCalledWith(outPoints, true)
    })
  })

  describe('getLockedBalance', () => {
    it('no current wallet', async () => {
      getCurrentWalletMock.mockReturnValue(undefined)
      await expect(CellManagement.getLockedBalance()).rejects.toThrow(new CurrentWalletNotSet())
    })
    it('success', async () => {
      getCurrentWalletMock.mockReturnValue({ id: 'walletId1' })
      getLockedCellsMock.mockResolvedValueOnce([{ capacity: '6100000000' }, { capacity: '6100000000' }])
      expect(await CellManagement.getLockedBalance()).toBe('12200000000')
    })
  })
})
