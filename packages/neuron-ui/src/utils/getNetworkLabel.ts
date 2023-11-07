import { LIGHT_CLIENT_MAINNET, LIGHT_CLIENT_TESTNET } from './const'

export const getNetworkLabelI18nkey = (type: State.Network['chain']) => {
  switch (type) {
    case 'ckb': {
      return 'settings.network.mainnet'
    }
    case 'ckb_testnet': {
      return 'settings.network.testnet'
    }
    case LIGHT_CLIENT_TESTNET: {
      return 'settings.network.lightTestnet'
    }
    case LIGHT_CLIENT_MAINNET: {
      return 'settings.network.lightMainnet'
    }
    default: {
      return 'settings.network.devnet'
    }
  }
}

export default getNetworkLabelI18nkey
