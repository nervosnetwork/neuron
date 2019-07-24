import { walletsCall } from 'services/UILayer'
import { AppActions } from '../reducer'

export default {
  updateDescription: ({
    type,
    walletID,
    key,
    description,
  }: {
    type: 'address' | 'transaction'
    walletID: string
    key: string
    description: string
  }) => {
    if (type === 'address') {
      walletsCall.updateAddressDescription({
        walletID,
        address: key,
        description,
      })
      return {
        type: AppActions.Ignore,
        payload: null,
      }
    }
    if (type === 'transaction') {
      return {
        type: AppActions.Ignore,
        payload: null,
      }
    }
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
}
