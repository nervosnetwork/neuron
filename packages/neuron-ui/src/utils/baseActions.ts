import { AppActions } from 'states'
import { isSuccessResponse } from './is'
import { ErrorCode, ResponseCode } from './enums'

export const sendTxBaseAction = async (sendMethod: any, params: any, dispatch: any, addNotification: any) => {
  dispatch({ type: AppActions.UpdateLoadings, payload: { sending: true } })
  try {
    const res = await sendMethod(params)
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

export default { sendTxBaseAction }
