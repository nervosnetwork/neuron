import { LIGHT_CLIENT_TESTNET } from './const'

export const getNetworkLabelI18nkey = (type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string) => {
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
    default: {
      return 'settings.network.devnet'
    }
  }
}

export default getNetworkLabelI18nkey
