import Script from '../models/chain/script'
import LiveCell, { CellWithOutPoint } from '../models/chain/live-cell'
import { queryIndexer } from '../block-sync-renderer/index'
import { type QueryOptions } from '@ckb-lumos/base'

export default class LiveCellService {
  private static instance: LiveCellService

  public static getInstance = () => {
    if (!LiveCellService.instance) {
      LiveCellService.instance = new LiveCellService()
    }

    return LiveCellService.instance
  }

  constructor() {}

  private async getLiveCellsByScript(
    lock: Script | null,
    type: Script | null,
    data: string | null
  ): Promise<CellWithOutPoint[]> {
    if (!lock && !type) {
      throw new Error('at least one parameter is required')
    }

    const query = { lock, type, data } as QueryOptions
    const liveCells = await queryIndexer(query)
    return liveCells as CellWithOutPoint[]
  }

  public async getOneByLockScriptAndTypeScript(lock: Script | null, type: Script | null) {
    const result = await this.getLiveCellsByScript(lock, type, null)
    if (result.length === 0) {
      return null
    }

    const typeHash = type ? type.computeHash() : ''
    for (let i = 0; i < result.length; i++) {
      const item = LiveCell.fromLumos(result[i])
      if (type) {
        if (typeHash === item.typeHash) {
          return item
        }
      } else {
        // if type is falsy, should return cell that type is empty
        if (!item.type()) {
          return item
        }
      }
    }

    return null
  }

  public async getManyByLockScriptAndTypeScript(lock: Script | null, type: Script | null) {
    const result = await this.getLiveCellsByScript(lock, type, null)

    const cells = []

    const typeHash = type ? type.computeHash() : ''
    for (let i = 0; i < result.length; i++) {
      const item = LiveCell.fromLumos(result[i])
      if (type) {
        if (typeHash === item.typeHash) {
          cells.push(item)
        }
      } else {
        cells.push(item)
      }
    }

    return cells
  }

  public async getManyByLockScriptsAndTypeScript(locks: Script[], type: Script | null) {
    const result = []

    for (const lock of locks) {
      const cells = await this.getManyByLockScriptAndTypeScript(lock, type)
      if (cells.length > 0) {
        result.push(...cells)
      }
    }

    return result
  }
}
