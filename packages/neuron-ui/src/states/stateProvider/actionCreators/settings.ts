import { addressBook } from 'utils/localCache'
import { NeuronWalletActions } from '../reducer'

export default {
  toggleAddressBook: () => {
    addressBook.toggleVisibility()
    return {
      type: NeuronWalletActions.Settings,
      payload: {
        toggleAddressBook: true,
      },
    }
  },
}
