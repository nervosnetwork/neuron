import TypeChecker from 'utils/type-checker'

export default class CellData {
  public content: string
  public hash: string

  constructor(content: string, hash: string) {
    this.content = content
    this.hash = hash

    TypeChecker.hashChecker(this.hash)
  }

  public static fromSDK(cellData: { content: string, hash: string }): CellData {
    return new CellData(
      cellData.content,
      cellData.hash
    )
  }
}
