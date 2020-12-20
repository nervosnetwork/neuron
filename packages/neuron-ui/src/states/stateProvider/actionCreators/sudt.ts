import { ErrorCode, isSuccessResponse, failureResToNotification, sendTxBaseAction } from 'utils'
import {
  sendCreateSUDTAccountTransaction as sendCreateAccountTx,
  sendSUDTTransaction as sendSUDTTx,
  migrateAcp as migrateAcpIpc,
} from 'services/remote'
import { AppActions, StateDispatch } from '../reducer'
import { addNotification } from './app'

export const sendCreateSUDTAccountTransaction = (params: Controller.SendCreateSUDTAccountTransaction.Params) => async (
  dispatch: StateDispatch
) => sendTxBaseAction(sendCreateAccountTx, params, dispatch, addNotification)

export const sendSUDTTransaction = (params: Controller.SendSUDTTransaction.Params) => async (dispatch: StateDispatch) =>
  sendTxBaseAction(sendSUDTTx, params, dispatch, addNotification)

export const migrateAcp = (params: Controller.MigrateAcp.Params) => async (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await migrateAcpIpc(params)
    if (res.status !== ErrorCode.PasswordIncorrect) {
      dispatch({
        type: AppActions.DismissPasswordRequest,
      })
      if (!isSuccessResponse(res)) {
        addNotification(failureResToNotification(res))(dispatch)
      }
    }
    return res.status
  } catch (err) {
    console.warn(err)
    return 0
  } finally {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }
}
