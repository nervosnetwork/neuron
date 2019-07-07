import { addressBook } from 'utils/localCache'

export const settingsState: State.Settings = {
  showAddressBook: addressBook.isVisible(),
  networks: [],
  wallets: [],
}

export default settingsState
