import CellInfo from './cell-info'

export default class CellWithStatus {
  public status: string
  public cell?: CellInfo

  constructor(status: string, cell?: CellInfo) {
    this.status = status
    this.cell = cell
  }

  public static fromSDK(cellWithStatus: { cell: CKBComponents.LiveCell, status: CKBComponents.CellStatus }): CellWithStatus {
    return new CellWithStatus(
      cellWithStatus.status,
      cellWithStatus.cell ? CellInfo.fromSDK(cellWithStatus.cell) : undefined
    )
  }
}
