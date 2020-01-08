import Output from './output'
import CellData from './cell-data'

export default class CellInfo {
  constructor(
    public output: Output,
    public data?: CellData
  ) {}

  public static fromSDK(cellInfo: CKBComponents.LiveCell): CellInfo {
    return new CellInfo(
      Output.fromSDK(cellInfo.output),
      cellInfo.data ? CellData.fromSDK(cellInfo.data) : undefined,
    )
  }
}
