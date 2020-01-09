import Output from './output'
import CellData from './cell-data'

export default class CellInfo {
  public output: Output
  public data?: CellData

  constructor(output: Output, data?: CellData) {
    this.output = output
    this.data = data
  }

  public static fromSDK(cellInfo: CKBComponents.LiveCell): CellInfo {
    return new CellInfo(
      Output.fromSDK(cellInfo.output),
      cellInfo.data ? CellData.fromSDK(cellInfo.data) : undefined,
    )
  }
}
