import { useHistory } from 'react-router-dom'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { Routes, ErrorCode } from 'utils/const'
import {
  sendCreateSUDTAccountTransaction as sendCreateAccountTx,
  sendSUDTTransaction as sendSUDTTx,
} from 'services/remote'
import { addNotification } from './app'

export const sendCreateSUDTAccountTransaction = (params: Controller.SendCreateSUDTAccountTransaction.Params) => (
  dispatch: StateDispatch,
  history: ReturnType<typeof useHistory>
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  return sendCreateAccountTx(params)
    .then(res => {
      if (res.status === 1) {
        dispatch({ type: AppActions.DismissPasswordRequest })
        history.push(Routes.History)
      } else if (res.status !== ErrorCode.PasswordIncorrect) {
        addNotification({
          type: 'alert',
          timestamp: +new Date(),
          code: res.status,
          content: typeof res.message === 'string' ? res.message : res.message.content,
          meta: typeof res.message === 'string' ? undefined : res.message.meta,
        })(dispatch)
        dispatch({ type: AppActions.DismissPasswordRequest })
      }
      return res.status
    })
    .catch(err => {
      console.warn(err)
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: { sending: false },
      })
    })
}

export const sendSUDTTransaction = (params: Controller.SendSUDTTransaction.Params) => (
  dispatch: StateDispatch,
  history: ReturnType<typeof useHistory>
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  return sendSUDTTx(params)
    .then(res => {
      if (res.status === 1) {
        dispatch({ type: AppActions.DismissPasswordRequest })
        history.push(Routes.History)
      } else if (res.status !== ErrorCode.PasswordIncorrect) {
        addNotification({
          type: 'alert',
          timestamp: +new Date(),
          code: res.status,
          content: typeof res.message === 'string' ? res.message : res.message.content,
          meta: typeof res.message === 'string' ? undefined : res.message.meta,
        })(dispatch)
        dispatch({ type: AppActions.DismissPasswordRequest })
      }
      return res.status
    })
    .catch(err => {
      console.warn(err)
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: { sending: false },
      })
    })
}

export default {
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
}
