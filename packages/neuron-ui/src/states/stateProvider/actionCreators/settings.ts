import { createNetwork as createRemoteNetwork, updateNetwork as updateRemoteNetwork } from 'services/remote'
import { addressBook } from 'utils/localCache'
import { Routes } from 'utils/const'
import { failureResToNotification } from 'utils/formatters'
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
    if (res.status === 1) {
      addPopup('create-network-successfully')(dispatch)
      history.push(Routes.SettingsNetworks)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export const updateNetwork = (params: Controller.UpdateNetworkParams) => (dispatch: StateDispatch, history: any) => {
  updateRemoteNetwork(params).then(res => {
    if (res.status === 1) {
      addPopup('update-network-successfully')(dispatch)
      history.push(Routes.SettingsNetworks)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
  })
}

export default {
  toggleAddressBook,
  createNetwork,
  updateNetwork,
}
