import { ErrorCode, isSuccessResponse, ResponseCode, failureResToNotification } from 'utils'
import {
  sendCreateSUDTAccountTransaction as sendCreateAccountTx,
  sendSUDTTransaction as sendSUDTTx,
  migrateAcp as migrateAcpIpc,
} from 'services/remote'
import { AppActions, StateDispatch } from '../reducer'
import { addNotification } from './app'

export const sendCreateSUDTAccountTransaction = (params: Controller.SendCreateSUDTAccountTransaction.Params) => async (
  dispatch: StateDispatch
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await sendCreateAccountTx(params)
    if (isSuccessResponse(res)) {
      dispatch({ type: AppActions.DismissPasswordRequest })
    } else if (res.status !== ErrorCode.PasswordIncorrect && res.status !== ErrorCode.SignTransactionFailed) {
      addNotification({
        type: 'alert',
        timestamp: +new Date(),
        code: res.status,
        content: typeof res.message === 'string' ? res.message : res.message.content,
        meta: typeof res.message === 'string' ? undefined : res.message.meta,
      })(dispatch)
      dispatch({ type: AppActions.DismissPasswordRequest })
    }
    return res
  } catch (err) {
    console.warn(err)
    return {
      status: ResponseCode.FAILURE,
      message: err,
    }
  } finally {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }
}

export const sendSUDTTransaction = (params: Controller.SendSUDTTransaction.Params) => async (
  dispatch: StateDispatch
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await sendSUDTTx(params)
    if (isSuccessResponse(res)) {
      dispatch({ type: AppActions.DismissPasswordRequest })
    } else if (res.status !== ErrorCode.PasswordIncorrect && res.status !== ErrorCode.SignTransactionFailed) {
      addNotification({
        type: 'alert',
        timestamp: +new Date(),
        code: res.status,
        content: typeof res.message === 'string' ? res.message : res.message.content,
        meta: typeof res.message === 'string' ? undefined : res.message.meta,
      })(dispatch)
      dispatch({ type: AppActions.DismissPasswordRequest })
    }
    return res
  } catch (err) {
    console.warn(err)
    return {
      status: ResponseCode.FAILURE,
      message: err,
    }
  } finally {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }
}

export const migrateAcp = (params: Controller.MigrateAcp.Params) => async (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await migrateAcpIpc(params)

    if (isSuccessResponse(res)) {
      dispatch({
        type: AppActions.DismissPasswordRequest,
      })
    }

    if (params.password) {
      if (res.status !== ErrorCode.PasswordIncorrect) {
        dispatch({
          type: AppActions.DismissPasswordRequest,
        })
        if (!isSuccessResponse(res)) {
          addNotification(failureResToNotification(res))(dispatch)
        }
      }
    }

    return res
  } catch (err) {
    console.warn(err)
    return { status: ResponseCode.FAILURE, message: err }
  } finally {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }
}
