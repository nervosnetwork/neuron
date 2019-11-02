export default class ChainInfo {
  private static instance: ChainInfo

  static getInstance(): ChainInfo {
    if (!ChainInfo.instance) {
      ChainInfo.instance = new ChainInfo()
    }

    return ChainInfo.instance
  }

  private chain: string = ''

  public setChain = (chain: string) => {
    this.chain = chain
  }

  public getChain = (): string => {
    return this.chain
  }

  public isMainnet = (): boolean => {
    return this.chain === 'ckb'
  }

  public explorerUrl = (): string => {
    if (this.isMainnet()) {
      return "https://explorer.nervos.org"
    }
    return "https://explorer.nervos.org" // TODO: change this to proper testnet explorer URL
  }
}
