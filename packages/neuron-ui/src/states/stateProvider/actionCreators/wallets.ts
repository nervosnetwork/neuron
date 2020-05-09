import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  getWalletList,
  getCurrentWallet,
  updateWallet,
  setCurrentWallet as setRemoteCurrentWallet,
  getDaoData,
  sendTx,
  getAddressesByWalletID,
  updateAddressDescription as updateRemoteAddressDescription,
  deleteWallet as deleteRemoteWallet,
  backupWallet as backupRemoteWallet,
} from 'services/remote'
import { emptyWallet } from 'states/init/wallet'
import { emptyNervosDaoData } from 'states/init/nervosDAO'
import { wallets as walletsCache, currentWallet as currentWalletCache } from 'services/localCache'
import { ErrorCode, ResponseCode, addressesToBalance, failureResToNotification, isSuccessResponse } from 'utils'
import { NeuronWalletActions } from '../reducer'
import { addNotification, addPopup } from './app'

export const updateCurrentWallet = () => (dispatch: StateDispatch) => {
  return getCurrentWallet().then(res => {
    if (isSuccessResponse(res)) {
      const payload = res.result || emptyWallet
      dispatch({
        type: NeuronWalletActions.UpdateCurrentWallet,
        payload,
      })
      currentWalletCache.save(payload)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
    return !!(res as any)?.result?.id
  })
}

export const updateWalletList = () => (dispatch: StateDispatch) => {
  return getWalletList().then(res => {
    if (isSuccessResponse(res)) {
      const payload = res.result || []
      dispatch({ type: NeuronWalletActions.UpdateWalletList, payload })
      walletsCache.save(payload)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
    return !!(res as any)?.result?.length
  })
}

export const updateWalletProperty = (params: Controller.UpdateWalletParams) => (dispatch: StateDispatch) => {
  return updateWallet(params).then(res => {
    if (isSuccessResponse(res)) {
      addPopup('update-wallet-successfully')(dispatch)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
    return res.status
  })
}
export const setCurrentWallet = (id: string) => (dispatch: StateDispatch) => {
  setRemoteCurrentWallet(id).then(res => {
    if (isSuccessResponse(res)) {
      dispatch({
        type: AppActions.Ignore,
        payload: null,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const sendTransaction = (params: Controller.SendTransactionParams) => async (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      sending: true,
    },
  })
  try {
    const res = await sendTx(params)
    if (isSuccessResponse(res)) {
      dispatch({ type: AppActions.DismissPasswordRequest })
    } else if (res.status !== ErrorCode.PasswordIncorrect) {
      addNotification({
        type: 'alert',
        timestamp: +new Date(),
        code: res.status,
        content: typeof res.message === 'string' ? res.message : res.message.content,
        meta: typeof res.message === 'string' ? undefined : res.message.meta,
      })(dispatch)
      dispatch({
        type: AppActions.DismissPasswordRequest,
      })
    }
    return res.status
  } catch (err) {
    console.warn(err)
    return ResponseCode.FAILURE
  } finally {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
  }
}

export const updateAddressListAndBalance = (params: Controller.GetAddressesByWalletIDParams) => (
  dispatch: StateDispatch
) => {
  getAddressesByWalletID(params).then(res => {
    if (isSuccessResponse(res)) {
      const addresses = res.result || []
      const balance = addressesToBalance(addresses)
      dispatch({
        type: NeuronWalletActions.UpdateAddressListAndBalance,
        payload: { addresses, balance },
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const updateAddressDescription = (params: Controller.UpdateAddressDescriptionParams) => (
  dispatch: StateDispatch
) => {
  const descriptionParams = { address: params.address, description: params.description }
  dispatch({
    type: NeuronWalletActions.UpdateAddressDescription,
    payload: descriptionParams,
  })
  updateRemoteAddressDescription(params).then(res => {
    if (isSuccessResponse(res)) {
      dispatch({
        type: NeuronWalletActions.UpdateAddressDescription,
        payload: descriptionParams,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const deleteWallet = (params: Controller.DeleteWalletParams) => async (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await deleteRemoteWallet(params)
    if (res.status !== ErrorCode.PasswordIncorrect) {
      dispatch({
        type: AppActions.DismissPasswordRequest,
      })
      if (isSuccessResponse(res)) {
        addPopup('delete-wallet-successfully')(dispatch)
      } else {
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

export const backupWallet = (params: Controller.BackupWalletParams) => async (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: { sending: true },
  })
  try {
    const res = await backupRemoteWallet(params)
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

export const updateNervosDaoData = (walletID: Controller.GetNervosDaoDataParams) => (dispatch: StateDispatch) => {
  getDaoData(walletID).then(res => {
    if (isSuccessResponse(res)) {
      dispatch({
        type: NeuronWalletActions.UpdateNervosDaoData,
        payload: { records: res.result },
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const clearNervosDaoData = () => (dispatch: StateDispatch) => {
  dispatch({
    type: NeuronWalletActions.UpdateNervosDaoData,
    payload: emptyNervosDaoData,
  })
}
