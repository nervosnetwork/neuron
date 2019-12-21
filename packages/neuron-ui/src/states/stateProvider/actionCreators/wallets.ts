import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  getWalletList,
  createWallet,
  importMnemonic,
  importKeystore,
  getCurrentWallet,
  updateWallet,
  setCurrentWallet as setRemoteCurrentWallet,
  getDaoData,
  sendTx,
  getAddressesByWalletID,
  updateAddressDescription as updateRemoteAddressDescription,
  deleteWallet as deleteRemoteWallet,
  backupWallet as backupRemoteWallet,
  showErrorMessage,
} from 'services/remote'
import { emptyWallet } from 'states/initStates/wallet'
import { emptyNervosDaoData } from 'states/initStates/nervosDAO'
import { WalletWizardPath } from 'components/WalletWizard'
import i18n from 'utils/i18n'
import { wallets as walletsCache, currentWallet as currentWalletCache } from 'services/localCache'
import { Routes, ErrorCode } from 'utils/const'
import { addressesToBalance, failureResToNotification } from 'utils/formatters'
import { NeuronWalletActions } from '../reducer'
import { addNotification, addPopup } from './app'

export const updateCurrentWallet = () => (dispatch: StateDispatch, history: any) => {
  getCurrentWallet().then(res => {
    if (res.status === 1) {
      const payload = res.result || emptyWallet
      if (!payload || !payload.id) {
        history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
      }
      dispatch({
        type: NeuronWalletActions.UpdateCurrentWallet,
        payload,
      })
      currentWalletCache.save(payload)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const createWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (
  _dispatch: StateDispatch,
  history: any
) => {
  return createWallet(params).then(res => {
    if (res.status === 1) {
      history.push(Routes.Overview)
    } else if (res.status > 0) {
      showErrorMessage(i18n.t(`messages.error`), i18n.t(`messages.codes.${res.status}`))
    } else if (res.message) {
      const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
      if (msg) {
        showErrorMessage(i18n.t(`messages.error`), msg)
      }
    }
  })
}

export const importWalletWithMnemonic = (params: Controller.ImportMnemonicParams) => (
  _dispatch: StateDispatch,
  history: any
) => {
  return importMnemonic(params).then(res => {
    if (res.status === 1) {
      history.push(Routes.Overview)
    } else if (res.status > 0) {
      showErrorMessage(i18n.t(`messages.error`), i18n.t(`messages.codes.${res.status}`))
    } else if (res.message) {
      const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
      if (msg) {
        showErrorMessage(i18n.t(`messages.error`), msg)
      }
    }
  })
}

export const importWalletWithKeystore = (params: Controller.ImportKeystoreParams) => (
  _dispatch: StateDispatch,
  history: any
) => {
  return importKeystore(params).then(res => {
    if (res.status === 1) {
      history.push(Routes.Overview)
    } else if (res.status > 0) {
      showErrorMessage(i18n.t(`messages.error`), i18n.t(`messages.codes.${res.status}`))
    } else if (res.message) {
      const msg = typeof res.message === 'string' ? res.message : res.message.content || ''
      if (msg) {
        showErrorMessage(i18n.t(`messages.error`), msg)
      }
    }
  })
}

export const updateWalletList = () => (dispatch: StateDispatch, history: any) => {
  getWalletList().then(res => {
    if (res.status === 1) {
      const payload = res.result || []
      if (!payload.length) {
        history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
      }
      dispatch({
        type: NeuronWalletActions.UpdateWalletList,
        payload,
      })
      walletsCache.save(payload)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const updateWalletProperty = (params: Controller.UpdateWalletParams) => (
  dispatch: StateDispatch,
  history?: any
) => {
  updateWallet(params).then(res => {
    if (res.status === 1) {
      addPopup('update-wallet-successfully')(dispatch)
      if (history) {
        history.push(Routes.SettingsWallets)
      }
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}
export const setCurrentWallet = (id: string) => (dispatch: StateDispatch) => {
  setRemoteCurrentWallet(id).then(res => {
    if (res.status === 1) {
      dispatch({
        type: AppActions.Ignore,
        payload: null,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const sendTransaction = (params: Controller.SendTransactionParams) => (
  dispatch: StateDispatch,
  history: any
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      sending: true,
    },
  })
  setTimeout(() => {
    sendTx(params)
      .then(res => {
        if (res.status === 1) {
          dispatch({
            type: AppActions.ClearNotificationsOfCode,
            payload: ErrorCode.PasswordIncorrect,
          })
          history.push(Routes.History)
        } else {
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
        }
        dispatch({
          type: AppActions.DismissPasswordRequest,
        })
      })
      .catch(err => {
        console.warn(err)
      })
      .finally(() => {
        dispatch({
          type: AppActions.UpdateLoadings,
          payload: {
            sending: false,
          },
        })
      })
  }, 0)
}

export const updateAddressListAndBalance = (params: Controller.GetAddressesByWalletIDParams) => (
  dispatch: StateDispatch
) => {
  getAddressesByWalletID(params).then(res => {
    if (res.status === 1) {
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
  const descriptionParams = {
    address: params.address,
    description: params.description,
  }
  dispatch({
    type: NeuronWalletActions.UpdateAddressDescription,
    payload: descriptionParams,
  })
  updateRemoteAddressDescription(params).then(res => {
    if (res.status === 1) {
      dispatch({
        type: NeuronWalletActions.UpdateAddressDescription,
        payload: descriptionParams,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const deleteWallet = (params: Controller.DeleteWalletParams) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.DismissPasswordRequest,
  })
  deleteRemoteWallet(params).then(res => {
    if (res.status === 1) {
      addPopup('delete-wallet-successfully')(dispatch)
      dispatch({
        type: AppActions.ClearNotificationsOfCode,
        payload: ErrorCode.PasswordIncorrect,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const backupWallet = (params: Controller.BackupWalletParams) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.DismissPasswordRequest,
  })
  backupRemoteWallet(params).then(res => {
    if (res.status === 1) {
      dispatch({
        type: AppActions.ClearNotificationsOfCode,
        payload: ErrorCode.PasswordIncorrect,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const updateNervosDaoData = (walletID: Controller.GetNervosDaoDataParams) => (dispatch: StateDispatch) => {
  getDaoData(walletID).then(res => {
    if (res.status === 1) {
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

export default {
  createWalletWithMnemonic,
  importWalletWithMnemonic,
  updateCurrentWallet,
  updateWalletList,
  updateWallet,
  setCurrentWallet,
  sendTransaction,
  updateAddressListAndBalance,
  updateAddressDescription,
  deleteWallet,
  backupWallet,
  updateNervosDaoData,
}
