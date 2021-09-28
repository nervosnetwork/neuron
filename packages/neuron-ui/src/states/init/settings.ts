import { wallets, networks } from 'services/localCache'

export const settingsState: State.Settings = {
  general: {},
  networks: networks.load(),
  wallets: wallets.load(),
}

export default settingsState
