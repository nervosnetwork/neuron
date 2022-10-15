import { createNetwork as createRemoteNetwork, updateNetwork as updateRemoteNetwork } from 'services/remote'
import { RoutePath, failureResToNotification } from 'utils'
import { NavigateFunction } from 'react-router-dom'
import { addNotification, addPopup } from './app'

import { AppActions, StateDispatch } from '../reducer'

export const createNetwork = (params: Controller.CreateNetworkParams) => (
  dispatch: StateDispatch,
  navigate: NavigateFunction
) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      network: true,
    },
  })
  createRemoteNetwork(params)
    .then(res => {
      if (res.status === 1) {
        addPopup('create-network-successfully')(dispatch)
        navigate(RoutePath.SettingsNetworks)
      } else {
        addNotification(failureResToNotification(res))(dispatch)
      }
    })
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: {
          network: false,
        },
      })
    })
}

export const updateNetwork = (params: Controller.UpdateNetworkParams) => (dispatch: StateDispatch, navigate: any) => {
  return updateRemoteNetwork(params).then(res => {
    if (res.status === 1) {
      addPopup('update-network-successfully')(dispatch)
      navigate(RoutePath.SettingsNetworks)
    } else {
      addNotification(failureResToNotification(res))(dispatch)
    }
    return res.status
  })
}
