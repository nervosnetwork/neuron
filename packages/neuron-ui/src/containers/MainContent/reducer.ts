import { CapacityUnit } from '../../utils/const'
import actionCreators from './actionCreators'
import MainActions from './actions'
import initState from './state'

export { MainActions } from './actions'
export { actionCreators } from './actionCreators'
export { initState } from './state'
export type MainActionCreators = typeof actionCreators
export type MainDispatch = React.Dispatch<{ type: MainActions; payload?: any }>

export type InitState = typeof initState
export const reducer = (state: typeof initState, action: { type: MainActions; payload: any }) => {
  switch (action.type) {
    // wallet
    // case MainActions.UpdateTempWallet: {
    //   return {
    //     ...state,
    //     tempWallet: {
    //       ...state.tempWallet,
    //       ...action.payload,
    //     },
    //   }
    // }
    // network
    case MainActions.UpdateNetworkEditor: {
      return {
        ...state,
        networkEditor: {
          ...state.networkEditor,
          ...action.payload,
        },
      }
    }
    case MainActions.DeleteNetwork: {
      return {
        ...state,
        networkEditor: {
          ...state.networkEditor,
          ...action.payload,
        },
      }
    }
    // transfer
    case MainActions.AddItemInTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items: [
            ...state.transfer.items,
            {
              address: '',
              capacity: '',
              unit: CapacityUnit.CKB,
            },
          ],
          submitting: false,
        },
      }
    }
    case MainActions.RemoveItemInTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items: [...state.transfer.items].splice(action.payload),
          submitting: false,
        },
      }
    }
    case MainActions.UpdateItemInTransfer: {
      const items = [...state.transfer.items]
      items[action.payload.idx] = {
        ...items[action.payload.idx],
        ...action.payload.item,
      }
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items,
        },
      }
    }
    case MainActions.UpdateTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          ...state.transfer,
          submitting: false,
          ...action.payload,
        },
      }
    }
    case MainActions.UpdatePassword: {
      return {
        ...state,
        password: action.payload,
      }
    }
    case MainActions.UpdateLoading: {
      return {
        ...state,
        loadings: {
          ...state.loadings,
          ...action.payload,
        },
      }
    }
    case MainActions.ErrorMessage: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          ...action.payload,
        },
        transfer: {
          ...state.transfer,
          submitting: action.payload.transfer ? false : state.transfer.submitting,
        },
      }
    }
    case MainActions.SetDialog: {
      return {
        ...state,
        dialog: action.payload,
      }
    }
    default: {
      return state
    }
  }
}
