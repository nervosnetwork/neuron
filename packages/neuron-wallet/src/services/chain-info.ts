import NetworksService from './networks'

export default class ChainInfo {
  private static instance: ChainInfo

  static getInstance(): ChainInfo {
    if (!ChainInfo.instance) {
      ChainInfo.instance = new ChainInfo()
    }

    return ChainInfo.instance
  }

  public setChain = (_chain: string) => {
  }

  public getChain = (): string => {
    return NetworksService.getInstance().getCurrent().chain
  }

  public isMainnet = (): boolean => {
    return this.getChain() === 'ckb'
  }

  public explorerUrl = (): string => {
    if (this.isMainnet()) {
      return "https://explorer.nervos.org"
    }
    return "https://explorer.nervos.org/testnet"
  }
}
