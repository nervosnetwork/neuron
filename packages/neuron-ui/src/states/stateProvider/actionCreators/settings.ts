import { createNetwork as createRemoteNetwork, updateNetwork as updateRemoteNetwork } from 'services/remote'
import { addressBook } from 'utils/localCache'
import { Routes } from 'utils/const'
import { addNotification, addPopup } from './app'

import { AppActions, StateDispatch } from '../reducer'

export const toggleAddressBook = () => {
  addressBook.toggleVisibility()
  return {
    type: AppActions.ToggleAddressBookVisibility,
    payload: null,
  }
}

export const createNetwork = (params: Controller.CreateNetworkParams) => (dispatch: StateDispatch, history: any) => {
  createRemoteNetwork(params).then(res => {
    if (res.status) {
      addPopup('create-network-successfully')(dispatch)
      history.push(Routes.SettingsNetworks)
    } else {
      addNotification({ type: 'alert', timestamp: +new Date(), code: res.message.code, content: res.message.content })(
        dispatch
      )
    }
  })
}

export const updateNetwork = (params: Controller.UpdateNetworkParams) => (dispatch: StateDispatch, history: any) => {
  updateRemoteNetwork(params).then(res => {
    if (res.status) {
      addPopup('update-network-successfully')(dispatch)
      history.push(Routes.SettingsNetworks)
    } else {
      addNotification({ type: 'alert', timestamp: +new Date(), code: res.message.code, content: res.message.content })(
        dispatch
      )
    }
  })
}

export default {
  toggleAddressBook,
  createNetwork,
  updateNetwork,
}
