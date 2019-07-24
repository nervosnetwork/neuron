import { walletsCall } from 'services/UILayer'

import { CKBToShannonFormatter } from 'utils/formatters'
import { TransactionOutput } from 'components/Send'

import { AppActions, StateDispatch } from '../reducer'

export const submitTransaction = (
  id: string = '',
  walletID: string = '',
  items: TransactionOutput[] = [],
  description: string = '',
  password: string = '',
  fee: string = '0'
) => (dispatch: StateDispatch) => {
  walletsCall.sendCapacity({
    id,
    walletID,
    items: items.map(item => ({
      address: item.address,
      capacity: CKBToShannonFormatter(item.amount, item.unit),
    })),
    password,
    fee,
    description,
  })
  dispatch({
    type: AppActions.DismissPasswordRequest,
    payload: null,
  })
}

export default {
  submitTransaction,
}
