import { addressBook } from 'utils/localCache'
import { NeuronWalletActions } from '../reducer'

export const toggleAddressBook = () => {
  addressBook.toggleVisibility()
  return {
    type: NeuronWalletActions.Settings,
    payload: {
      toggleAddressBook: true,
    },
  }
}

export default {
  toggleAddressBook,
}
