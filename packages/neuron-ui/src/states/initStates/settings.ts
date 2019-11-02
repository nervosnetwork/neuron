import { wallets, networks } from 'services/localCache'

export const settingsState: State.Settings = {
  general: {
    skipDataAndType: false,
  },
  networks: networks.load(),
  wallets: wallets.load(),
}

export default settingsState
