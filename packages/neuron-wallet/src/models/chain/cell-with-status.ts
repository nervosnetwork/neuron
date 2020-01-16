import CellInfo from './cell-info'

type CellStatus = 'live' | 'dead' | 'unknown'

export default class CellWithStatus {
  public status: CellStatus
  public cell?: CellInfo

  constructor(status: CellStatus, cell?: CellInfo) {
    this.status = status
    this.cell = cell
  }

  public isLive(): boolean {
    return this.status === 'live'
  }

  public static fromSDK(cellWithStatus: { cell: CKBComponents.LiveCell, status: CKBComponents.CellStatus }): CellWithStatus {
    return new CellWithStatus(
      cellWithStatus.status,
      cellWithStatus.cell ? CellInfo.fromSDK(cellWithStatus.cell) : undefined
    )
  }
}
