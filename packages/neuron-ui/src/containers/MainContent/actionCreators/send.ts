import { walletsCall, TransactionOutput } from 'services/UILayer'

import { Message } from 'utils/const'
import { verifyAddress } from 'utils/validators'
import { CKBToShannonFormatter } from 'utils/formatters'

import { MainActions } from '../reducer'

export default {
  submitTransaction: (id: string, items: TransactionOutput[]) => {
    const errorAction = {
      type: MainActions.ErrorMessage,
      payload: {
        send: Message.AtLeastOneAddressNeeded as string,
      },
    }
    if (!items.length || !items[0].address) {
      return errorAction
    }
    const invalid = items.some(
      (item): boolean => {
        if (!verifyAddress(item.address)) {
          errorAction.payload.send = Message.InvalidAddress
          return true
        }
        if (Number.isNaN(+item.amount) || +item.amount < 0) {
          errorAction.payload.send = Message.InvalidAmount
          return true
        }
        return false
      }
    )
    if (invalid) {
      return errorAction
    }
    walletsCall.sendCapacity({
      id,
      items: items.map(item => ({
        address: item.address,
        capacity: CKBToShannonFormatter(item.amount, item.unit),
      })),
      fee: '0',
    })
    return {
      type: MainActions.UpdateSendState,
      payload: {
        submitting: true,
      },
    }
  },
}
