import { setSkipDataAndType as setRemoteSkipDataAndType } from 'services/remote'
import { failureResToNotification } from 'utils/formatters'
import { StateDispatch, NeuronWalletActions } from '../reducer'
import { addNotification } from './app'

export const setSkipDataAndType = (skip: Controller.SetSkipAndTypeParam) => (dispatch: StateDispatch) => {
  setRemoteSkipDataAndType(skip).then(res => {
    if (res.status === 1) {
      dispatch({
        type: NeuronWalletActions.UpdateSkipDataAndType,
        payload: res.result,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export default {
  setSkipDataAndType,
}
