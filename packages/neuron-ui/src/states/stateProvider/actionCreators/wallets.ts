import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  getWalletList,
  createWallet,
  importMnemonic,
  importKeystore,
  getCurrentWallet,
  updateWallet,
  setCurrentWallet as setRemoteCurrentWallet,
  sendCapacity,
  getAddressesByWalletID,
  updateAddressDescription as updateRemoteAddressDescription,
  deleteWallet as deleteRemoteWallet,
  backupWallet as backupRemoteWallet,
  showErrorMessage,
} from 'services/remote'
import initStates from 'states/initStates'
import { WalletWizardPath } from 'components/WalletWizard'
import i18n from 'utils/i18n'
import { wallets as walletsCache, currentWallet as currentWalletCache } from 'utils/localCache'
import { Routes } from 'utils/const'
import { addressesToBalance, failureResToNotification } from 'utils/formatters'
import { NeuronWalletActions } from '../reducer'
import { addNotification, addPopup } from './app'

export const updateCurrentWallet = () => (dispatch: StateDispatch, history: any) => {
  getCurrentWallet().then(res => {
    if (res.status === 1) {
      const payload = res.result || initStates.wallet
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
  createWallet(params).then(res => {
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
  importMnemonic(params).then(res => {
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
  importKeystore(params).then(res => {
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
    if (res.status) {
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
    if (res.status) {
      dispatch({
        type: AppActions.Ignore,
        payload: null,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const sendTransaction = (params: Controller.SendTransaction) => (dispatch: StateDispatch, history: any) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      sending: true,
    },
  })
  sendCapacity(params)
    .then(res => {
      if (res.status === 1) {
        history.push(Routes.History)
      } else {
        // TODO: the pretreatment is unnecessary once the error code is implemented
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
        payload: null,
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
}

export const updateAddressListAndBalance = (params: Controller.GetAddressesByWalletIDParams) => (
  dispatch: StateDispatch
) => {
  getAddressesByWalletID(params).then(res => {
    if (res.status) {
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
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      updateDescription: true,
    },
  })
  updateRemoteAddressDescription(params)
    .then(res => {
      if (res.status) {
        dispatch({
          type: NeuronWalletActions.UpdateAddressDescription,
          payload: {
            address: params.address,
            description: params.description,
          },
        })
      } else {
        addNotification(failureResToNotification(res))(dispatch)
      }
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: {
          updateDescription: false,
        },
      })
    })
}

export const deleteWallet = (params: Controller.DeleteWalletParams) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.DismissPasswordRequest,
    payload: null,
  })
  deleteRemoteWallet(params).then(res => {
    if (res.status) {
      addPopup('delete-wallet-successfully')(dispatch)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const backupWallet = (params: Controller.BackupWalletParams) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.DismissPasswordRequest,
    payload: null,
  })
  backupRemoteWallet(params).then(res => {
    if (res.status) {
      dispatch({
        type: AppActions.Ignore,
        payload: null,
      })
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
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
}
