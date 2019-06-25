import { CapacityUnit } from 'utils/const'
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
    case MainActions.AddTransactionOutput: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          send: '',
        },
        send: {
          outputs: [
            ...state.send.outputs,
            {
              address: '',
              amount: '',
              unit: CapacityUnit.CKB,
            },
          ],
          submitting: false,
        },
      }
    }
    case MainActions.RemoveTransactionOutput: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          send: '',
        },
        send: {
          // outputs: [...state.send.outputs].splice(action.payload),
          outputs: state.send.outputs.filter((_, idx) => idx !== action.payload),
          submitting: false,
        },
      }
    }
    case MainActions.UpdateTransactionOutput: {
      const outputs = [...state.send.outputs]
      outputs[action.payload.idx] = {
        ...outputs[action.payload.idx],
        ...action.payload.item,
      }
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          send: '',
        },
        send: { outputs },
      }
    }
    case MainActions.UpdateTransactionPrice: {
      return {
        ...state,
        send: {
          ...state.send,
          price: action.payload,
        },
      }
    }
    case MainActions.UpdateSendDescription: {
      return {
        ...state,
        send: {
          ...state.send,
          description: action.payload || '',
        },
      }
    }
    case MainActions.UpdateSendState: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          send: '',
        },
        send: {
          ...state.send,
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
        send: {
          ...state.send,
          submitting: action.payload.send ? false : state.send.submitting,
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
