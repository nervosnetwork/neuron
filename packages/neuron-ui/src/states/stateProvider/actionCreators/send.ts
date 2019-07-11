import { walletsCall } from 'services/UILayer'

import { CKBToShannonFormatter } from 'utils/formatters'
import { TransactionOutput } from 'components/Send'

import { AppActions } from '../reducer'

export default {
  submitTransaction: (
    id: string = '',
    walletID: string = '',
    items: TransactionOutput[] = [],
    description: string = '',
    password: string = ''
  ) => {
    walletsCall.sendCapacity({
      id,
      walletID,
      items: items.map(item => ({
        address: item.address,
        capacity: CKBToShannonFormatter(item.amount, item.unit),
      })),
      password,
      fee: '0',
      description,
    })
    return {
      type: AppActions.DismissPasswordRequest,
      payload: null,
    }
  },
}
