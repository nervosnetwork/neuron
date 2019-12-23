import { wallets, networks } from 'services/localCache'

export const settingsState: Readonly<State.Settings> = {
  general: {},
  networks: networks.load(),
  wallets: wallets.load(),
}

export default settingsState
