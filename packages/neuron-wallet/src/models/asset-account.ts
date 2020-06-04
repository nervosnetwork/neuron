export default class AssetAccount {
  public id?: number
  public tokenID: string
  public symbol: string
  public accountName: string
  public tokenName: string
  public decimal: string
  public balance: string
  public blake160: string

  constructor(
    tokenID: string,
    symbol: string,
    accountName: string,
    tokenName: string,
    decimal: string,
    balance: string,
    blake160: string,
    id?: number
  ) {
    this.tokenID = tokenID
    this.symbol = symbol
    this.accountName = accountName
    this.tokenName = tokenName
    this.decimal = decimal
    this.balance = balance
    this.blake160 = blake160
    this.id = id
  }

  public static fromObject(params: {
    tokenID: string,
    symbol: string,
    accountName: string,
    tokenName: string,
    decimal: string,
    balance: string,
    blake160: string,
    id?: number
  }): AssetAccount {
    return new AssetAccount(
      params.tokenID,
      params.symbol,
      params.accountName,
      params.tokenName,
      params.decimal,
      params.balance,
      params.blake160,
      params.id
    )
  }
}
