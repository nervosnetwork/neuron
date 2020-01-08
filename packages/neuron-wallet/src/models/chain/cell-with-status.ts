import CellInfo from './cell-info'

export default class CellWithStatus {
  constructor(
    public status: string,
    public cell?: CellInfo
  ) {}

  public static fromSDK(cellWithStatus: { cell: CKBComponents.LiveCell, status: CKBComponents.CellStatus }): CellWithStatus {
    return new CellWithStatus(
      cellWithStatus.status,
      cellWithStatus.cell ? CellInfo.fromSDK(cellWithStatus.cell) : undefined
    )
  }
}
