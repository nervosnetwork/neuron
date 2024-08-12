import type { OutPoint } from '@ckb-lumos/lumos'
import CellLocalInfoService from '../../src/services/cell-local-info'
import { closeConnection, getConnection, initConnection } from '../setupAndTeardown'
import CellLocalInfo from '../../src/database/chain/entities/cell-local-info'

const outPoints = [
  {
    txHash: `0x${'00'.repeat(32)}`,
    index: '0',
  },
  {
    txHash: `0x${'00'.repeat(32)}`,
    index: '1',
  },
]

const createCellLocalInfo = (outPoint: OutPoint, locked?: boolean, description?: string) => {
  const cellLocalInfo = new CellLocalInfo()
  cellLocalInfo.outPoint = outPoint
  cellLocalInfo.locked = locked
  cellLocalInfo.description = description
  return cellLocalInfo
}

const getLiveOrSentCellByWalletIdMock = jest.fn()

function resetMocks() {
  getLiveOrSentCellByWalletIdMock.mockReset()
}

jest.mock('../../src/services/cells', () => ({
  getLiveOrSentCellByWalletId: () => getLiveOrSentCellByWalletIdMock(),
}))

describe('CellLocalInfoService', () => {
  beforeAll(async () => {
    await initConnection()
  })
  afterAll(async () => {
    await closeConnection()
  })
  beforeEach(async () => {
    resetMocks()
    const connection = getConnection()
    await connection.synchronize(true)
  })
  describe('getCellLocalInfoMap', () => {
    const cellLocalInfo = createCellLocalInfo(outPoints[0], false, '')
    beforeEach(async () => {
      await getConnection().getRepository(CellLocalInfo).createQueryBuilder().insert().values(cellLocalInfo).execute()
    })
    it('param is empty array', async () => {
      await expect(CellLocalInfoService.getCellLocalInfoMap([])).resolves.toStrictEqual({})
    })
    it('cannot find the outpoint', async () => {
      await expect(CellLocalInfoService.getCellLocalInfoMap([outPoints[1]])).resolves.toStrictEqual({})
    })
    it('find the outpoint', async () => {
      await expect(CellLocalInfoService.getCellLocalInfoMap([outPoints[0]])).resolves.toStrictEqual({
        [`${outPoints[0].txHash}_${outPoints[0].index}`]: cellLocalInfo,
      })
    })
  })

  describe('updateOrInsertCellLocalInfo', () => {
    it('insert entity', async () => {
      const cellLocalInfo = createCellLocalInfo(outPoints[0], false, '')
      await CellLocalInfoService.updateOrInsertCellLocalInfo(cellLocalInfo)
      await expect(getConnection().getRepository(CellLocalInfo).count()).resolves.toBe(1)
    })
    it('insert entities', async () => {
      const cellLocalInfo1 = createCellLocalInfo(outPoints[0], false, '')
      const cellLocalInfo2 = createCellLocalInfo(outPoints[1], true, '')
      await CellLocalInfoService.updateOrInsertCellLocalInfo([cellLocalInfo1, cellLocalInfo2])
      await expect(getConnection().getRepository(CellLocalInfo).count()).resolves.toBe(2)
    })
    it('update entity', async () => {
      const cellLocalInfo1 = createCellLocalInfo(outPoints[0], false, '')
      await CellLocalInfoService.updateOrInsertCellLocalInfo(cellLocalInfo1)
      cellLocalInfo1.locked = true
      cellLocalInfo1.description = 'desc'
      await CellLocalInfoService.updateOrInsertCellLocalInfo(cellLocalInfo1)
      const res = await getConnection().getRepository(CellLocalInfo).find()
      expect(res).toHaveLength(1)
      expect(res[0].locked).toBeTruthy()
      expect(res[0].description).toBe('desc')
    })
  })

  describe('saveCellLocalInfo', () => {
    it('insert entity', async () => {
      await CellLocalInfoService.saveCellLocalInfo({ outPoint: outPoints[0] })
      await expect(getConnection().getRepository(CellLocalInfo).count()).resolves.toBe(1)
    })
    it('update entity', async () => {
      await CellLocalInfoService.saveCellLocalInfo({ outPoint: outPoints[0] })
      await expect(getConnection().getRepository(CellLocalInfo).count()).resolves.toBe(1)
      await CellLocalInfoService.saveCellLocalInfo({ outPoint: outPoints[0], locked: true, description: 'desc' })
      const res = await getConnection().getRepository(CellLocalInfo).find()
      expect(res).toHaveLength(1)
      expect(res[0].locked).toBeTruthy()
      expect(res[0].description).toBe('desc')
    })
  })

  describe('updateLiveCellLockStatus', () => {
    it('create new entity', async () => {
      await CellLocalInfoService.updateLiveCellLockStatus(outPoints, true)
      await expect(getConnection().getRepository(CellLocalInfo).findBy({ locked: true })).resolves.toHaveLength(2)
    })
    it('update entity locked', async () => {
      await CellLocalInfoService.updateLiveCellLockStatus(outPoints, true)
      await expect(getConnection().getRepository(CellLocalInfo).findBy({ locked: true })).resolves.toHaveLength(2)
      await CellLocalInfoService.updateLiveCellLockStatus(outPoints, false)
      await expect(getConnection().getRepository(CellLocalInfo).findBy({ locked: false })).resolves.toHaveLength(2)
    })
  })

  describe('getLockedOutPoints', () => {
    beforeEach(async () => {
      const cellLocalInfo1 = createCellLocalInfo(outPoints[0], true)
      const cellLocalInfo2 = createCellLocalInfo(outPoints[1], false)
      await getConnection()
        .getRepository(CellLocalInfo)
        .createQueryBuilder()
        .insert()
        .values([cellLocalInfo1, cellLocalInfo2])
        .execute()
    })
    it('outpoint is empty', async () => {
      await expect(CellLocalInfoService.getLockedOutPoints([])).resolves.toStrictEqual(new Set())
    })
    it('no locked outpoint', async () => {
      await expect(CellLocalInfoService.getLockedOutPoints([outPoints[1]])).resolves.toStrictEqual(new Set())
    })
    it('find locked outpoint', async () => {
      await expect(CellLocalInfoService.getLockedOutPoints(outPoints)).resolves.toStrictEqual(
        new Set([`${outPoints[0].txHash}_${outPoints[0].index}`])
      )
    })
  })

  describe('getLockedCells', () => {
    it('getLiveCells return without outPoint', async () => {
      getLiveOrSentCellByWalletIdMock.mockResolvedValueOnce([
        {
          toModel() {
            return {}
          },
        },
      ])
      await expect(CellLocalInfoService.getLockedCells('')).resolves.toHaveLength(0)
    })
    it('no locked cell', async () => {
      getLiveOrSentCellByWalletIdMock.mockResolvedValueOnce([
        {
          toModel() {
            return { outPoint: outPoints[0] }
          },
        },
      ])
      await expect(CellLocalInfoService.getLockedCells('')).resolves.toHaveLength(0)
    })
    it('exist locked cell', async () => {
      const cellLocalInfo = createCellLocalInfo(outPoints[0], true)
      await getConnection().getRepository(CellLocalInfo).createQueryBuilder().insert().values(cellLocalInfo).execute()
      getLiveOrSentCellByWalletIdMock.mockResolvedValueOnce([
        {
          toModel() {
            return { outPoint: outPoints[0] }
          },
        },
      ])
      await expect(CellLocalInfoService.getLockedCells('')).resolves.toHaveLength(1)
    })
  })
})
