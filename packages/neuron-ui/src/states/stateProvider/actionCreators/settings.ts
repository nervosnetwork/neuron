import { createNetwork as createRemoteNetwork, updateNetwork as updateRemoteNetwork } from 'services/remote'
import { failureResToNotification } from 'utils'
import { addNotification, addPopup } from './app'

import { AppActions, StateDispatch } from '../reducer'

export const createNetwork =
  (params: Controller.CreateNetworkParams) => (dispatch: StateDispatch, callback: () => void) => {
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
          callback()
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

export const updateNetwork =
  (params: Controller.UpdateNetworkParams) => (dispatch: StateDispatch, callback: () => void) => {
    return updateRemoteNetwork(params).then(res => {
      if (res.status === 1) {
        addPopup('update-network-successfully')(dispatch)
        callback()
      } else {
        addNotification(failureResToNotification(res))(dispatch)
      }
      return res.status
    })
  }
