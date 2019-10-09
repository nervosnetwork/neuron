import { addressBook, wallets, networks } from 'services/localCache'

export const settingsState: State.Settings = {
  general: {
    skipDataAndType: false,
    showAddressBook: addressBook.isVisible(),
  },
  networks: networks.load(),
  wallets: wallets.load(),
}

export default settingsState
