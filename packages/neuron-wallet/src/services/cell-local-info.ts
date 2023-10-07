import { getConnection } from 'typeorm'
import CellLocalInfo, { outPointTransformer } from '../database/chain/entities/cell-local-info'
import CellsService from './cells'

export default class CellLocalInfoService {
  static async getCellLocalInfoMap(outPoints: CKBComponents.OutPoint[]) {
    const cellLocalInfos = await getConnection()
      .getRepository(CellLocalInfo)
      .createQueryBuilder()
      .where('outPoint IN (:...outPoints)', { outPoints: outPoints.map(v => `${v.txHash}_${v.index}`) })
      .getMany()
    const result: Record<string, CellLocalInfo> = {}
    cellLocalInfos.forEach(v => {
      result[outPointTransformer.to(v.outPoint)] = v
    })
    return result
  }

  static async updateOrInsertCellLocalInfo(cellLocalInfos: CellLocalInfo | CellLocalInfo[]) {
    await getConnection()
      .getRepository(CellLocalInfo)
      .createQueryBuilder()
      .insert()
      .orUpdate(['locked', 'description'], ['outPoint'])
      .values(cellLocalInfos)
      .execute()
  }

  static async saveCellLocalInfo(outPoint: CKBComponents.OutPoint, locked?: boolean, description?: string) {
    const cellLocalInfo: CellLocalInfo =
      (await getConnection().getRepository(CellLocalInfo).findOne({ where: { outPoint } })) ?? new CellLocalInfo()
    cellLocalInfo.outPoint = outPoint
    cellLocalInfo.locked = locked ?? cellLocalInfo.locked
    cellLocalInfo.description = description ?? cellLocalInfo.description
    await CellLocalInfoService.updateOrInsertCellLocalInfo(cellLocalInfo)
  }

  static async updateLiveCellLockStatus(outPoints: CKBComponents.OutPoint[], locked: boolean) {
    const cellLocalInfos: CellLocalInfo[] = outPoints.map(v => {
      const tmp = new CellLocalInfo()
      tmp.outPoint = v
      tmp.locked = locked
      return tmp
    })
    await CellLocalInfoService.updateOrInsertCellLocalInfo(cellLocalInfos)
  }

  static async getLockedOutPoints(outPoints: CKBComponents.OutPoint[]) {
    const lockedOutPoints = outPoints.map(v => outPointTransformer.to(v))
    const lockedCells = await getConnection()
      .getRepository(CellLocalInfo)
      .createQueryBuilder()
      .where('outPoint IN (:...lockedOutPoints)', { lockedOutPoints })
      .andWhere({ locked: true })
      .getMany()
    return new Set(lockedCells.map(v => outPointTransformer.to(v.outPoint)))
  }

  static async getLockedCells(walletId: string) {
    const liveCells = await CellsService.getLiveCells(walletId)
    const outPoints = liveCells.filter(v => !!v.outPoint).map(v => v.outPoint!)
    const lockedOutPointSet = await CellLocalInfoService.getLockedOutPoints(outPoints)
    return liveCells.filter(v => v.outPoint && lockedOutPointSet.has(outPointTransformer.to(v.outPoint)))
  }
}
