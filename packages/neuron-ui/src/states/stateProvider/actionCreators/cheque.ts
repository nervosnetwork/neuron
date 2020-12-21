import { sendWithdrawChequeTransaction as sendTx } from 'services/remote'
import { StateDispatch } from 'states'
import { sendTxBaseAction } from 'utils'
import { addNotification } from './app'

export const sendWithdrawChequeTransaction = (params: Controller.SendTransactionParams) => async (
  dispatch: StateDispatch
) => sendTxBaseAction(sendTx, params, dispatch, addNotification)

export default { sendWithdrawChequeTransaction }
