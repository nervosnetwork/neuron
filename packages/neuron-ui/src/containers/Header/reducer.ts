import { networksCall } from '../../services/UILayer'
import { Network } from '../../contexts/NeuronWallet'

export enum HeaderActions {
  SetNetwork,
}

export interface InitState {
  networks: Network[]
}

export const initState: InitState = { networks: [] }

export const reducer = (state: any, action: { type: HeaderActions; payload?: any }) => {
  switch (action.type) {
    case HeaderActions.SetNetwork: {
      return {
        ...state,
        network: action.payload,
      }
    }
    default: {
      return state
    }
  }
}

export const actionCreators = {
  setNetwork: (id: string) => {
    networksCall.activate(id)
    return {
      type: HeaderActions.SetNetwork,
      payload: id,
    }
  },
}

export type HeaderActionsCreators = typeof actionCreators
export type HeaderDispatch = React.Dispatch<{ type: string; payload?: any }>
