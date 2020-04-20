import { useHistory } from 'react-router-dom'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { Routes, ErrorCode } from 'utils/const'
import { sendCreateSUDTAccountTransaction as sendTx } from 'services/remote'
import { addNotification } from './app'

export const sendCreateSUDTAccountTransaction = (params: Controller.SendCreateSUDTAccountTransaction.Params) => (
  dispatch: StateDispatch,
  history: ReturnType<typeof useHistory>
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  return sendTx(params)
    .then(res => {
      if (res.status === 1) {
        dispatch({ type: AppActions.ClearNotificationsOfCode, payload: ErrorCode.PasswordIncorrect })
        dispatch({ type: AppActions.DismissPasswordRequest })
        history.push(Routes.History)
      } else if (res.status !== ErrorCode.PasswordIncorrect) {
        addNotification({
          type: 'alert',
          timestamp: +new Date(),
          code: res.status,
          content: (typeof res.message === 'string' ? res.message : res.message.content || '').replace(
            /(\b"|"\b)/g,
            ''
          ),
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
}
