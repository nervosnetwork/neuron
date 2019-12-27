export interface CellDataInterface {
  content: string,
  hash: string,
}

export class CellData implements CellDataInterface {
  private _content: string
  private _hash: string

  constructor({ content, hash }: CellDataInterface) {
    this._content = content
    this._hash = hash
  }

  public get content(): string {
    return this._content
  }

  public get hash(): string {
    return this._hash
  }

  public static fromSDK(cellData: { content: string, hash: string }): CellData {
    return new CellData({
      content: cellData.content,
      hash: cellData.hash
    })
  }
}
