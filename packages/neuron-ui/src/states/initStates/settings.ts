import { addressBook, wallets, networks } from 'utils/localCache'

export const settingsState: State.Settings = {
  showAddressBook: addressBook.isVisible(),
  networks: networks.load(),
  wallets: wallets.load(),
}

export default settingsState
