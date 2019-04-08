import { sendCapacity, TransferItem } from '../../../services/UILayer'

import { Message } from '../../../utils/const'
import { verifyAddress } from '../../../utils/validators'

import { MainActions } from '../reducer'

export default {
  submitTransfer: (items: TransferItem[]) => {
    // TODO: verification
    const errorAction = {
      type: MainActions.ErrorMessage,
      payload: {
        transfer: Message.AtLeastOneAddressNeeded as string,
      },
    }
    if (!items.length || !items[0].address) {
      return errorAction
    }
    const invalid = items.some(
      (item): boolean => {
        if (!verifyAddress(item.address)) {
          errorAction.payload.transfer = Message.InvalidAddress
          return true
        }
        if (+item.capacity < 0) {
          errorAction.payload.transfer = Message.InvalidCapacity
          return true
        }
        return false
      },
    )
    if (invalid) {
      return errorAction
    }
    return {
      type: MainActions.SetDialog,
      payload: {
        open: true,
        items,
      },
    }
  },

  confirmTransfer: ({ items, password }: { items: TransferItem[]; password: string }) => {
    sendCapacity(items, password)
    return {
      type: MainActions.UpdateTransfer,
      payload: {
        submitting: true,
      },
    }
  },
}
