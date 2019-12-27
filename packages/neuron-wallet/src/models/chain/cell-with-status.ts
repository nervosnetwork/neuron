import { CellInfoInterface, CellInfo } from './cell-info'

export interface CellWithStatusInterface {
  cell?: CellInfoInterface
  status: string
}

export class CellWithStatus implements CellWithStatusInterface {
  private _cell?: CellInfo
  private _status: string

  constructor({ cell, status }: CellWithStatusInterface) {
    this._cell = cell ? (cell.constructor.name === 'Object' ? new CellInfo(cell) : (cell as CellInfo)) : undefined
    this._status = status
  }

  public get cell(): CellInfo | undefined {
    return this._cell
  }

  public get status(): string {
    return this._status
  }

  public static fromSDK(cellWithStatus: { cell: CKBComponents.LiveCell, status: CKBComponents.CellStatus }): CellWithStatus {
    return new CellWithStatus({
      cell: cellWithStatus.cell ? CellInfo.fromSDK(cellWithStatus.cell) : undefined,
      status: cellWithStatus.status,
    })
  }
}
