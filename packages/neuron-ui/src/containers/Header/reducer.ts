import { networks, NetworksMethod } from '../../services/UILayer'
import { Network } from '../../contexts/Chain'

export enum HeaderActions {
  SetNetwork,
}

export interface InitState {
  networks: Network[]
}
export const initState: InitState = {
  networks: [],
}

export const reducer = (state: any, action: { type: HeaderActions; payload?: any }) => {
  switch (action.type) {
    case HeaderActions.SetNetwork: {
      return {
        ...state,
        netowrk: action.payload,
      }
    }
    default: {
      return state
    }
  }
}

export const actionCreators = {
  setNetwork: (network: Network) => {
    networks(NetworksMethod.SetActive, network.id)
    return {
      type: HeaderActions.SetNetwork,
      payload: network,
    }
  },
}

export type HeaderActionsCreators = typeof actionCreators
export type HeaderDispatch = React.Dispatch<{ type: string; payload?: any }>
