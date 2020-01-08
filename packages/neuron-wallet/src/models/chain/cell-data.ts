import TypeChecker from 'utils/type-checker'

export default class CellData {
  constructor(
    public content: string,
    public hash: string
  ) {
    TypeChecker.hashChecker(this.hash)
  }

  public static fromSDK(cellData: { content: string, hash: string }): CellData {
    return new CellData(
      cellData.content,
      cellData.hash
    )
  }
}
