import Output, { OutputInterface } from './output'
import { CellDataInterface, CellData } from './cell-data'

export interface CellInfoInterface {
  output: OutputInterface
  data?: CellDataInterface
}

export class CellInfo implements CellInfoInterface {
  private _output: Output
  private _data?: CellData

  constructor({ output, data }: CellInfoInterface) {
    this._output = output instanceof Output ? output : new Output(output)
    this._data = data ? (data instanceof CellData ? data : new CellData(data)) : undefined
  }

  public get output(): Output {
    return this._output
  }

  public get data(): CellData | undefined {
    return this._data
  }

  public static fromSDK(cellInfo: CKBComponents.LiveCell): CellInfo {
    return new CellInfo({
      output: Output.fromSDK(cellInfo.output),
      data: cellInfo.data ? CellData.fromSDK(cellInfo.data) : undefined,
    })
  }
}
