import React, { useReducer } from 'react'
import styled from 'styled-components'

import { createWallet, deleteWallet, importWallet, exportWallet } from '../../services/UILayer'

const Main = styled.main`
  height: 100%;
  width: 100%;
`

const initState = {
  tempWallet: {
    name: '',
    password: '',
    mnemonic: '',
  },
}

export enum MainActions {
  UpdateTempWallet,
  CreateWallet,
  DeleteWallet,
  ImportWallet,
  ExportWallet,
  GetTransactions,
  SetPage,
}

const reducers = (state: typeof initState, action: { type: MainActions; value: any }) => {
  switch (action.type) {
    case MainActions.UpdateTempWallet: {
      return {
        ...state,
        tempWallet: {
          ...state.tempWallet,
          ...action.value,
        },
      }
    }
    default: {
      return state
    }
  }
}
export type MainDispatch = React.Dispatch<{ type: MainActions; payload?: any }>

const actionCreators = {
  createWallet: (wallet: typeof initState.tempWallet) => {
    createWallet(wallet)
    return {
      type: MainActions.CreateWallet,
    }
  },
  importWallet: (wallet: typeof initState.tempWallet) => {
    importWallet(wallet)
    return {
      type: MainActions.ImportWallet,
    }
  },
  deleteWallet: (address: string) => {
    deleteWallet(address)
    return {
      type: MainActions.DeleteWallet,
    }
  },
  exportWallet: () => {
    exportWallet()
    return {
      type: MainActions.ExportWallet,
    }
  },
}

type InitState = typeof initState
export interface ContentProps extends InitState {
  dispatch: MainDispatch
  actionCreators: typeof actionCreators
}

const MainContent = ({ children }: { children?: any }) => {
  const [state, dispatch] = useReducer(reducers, initState)

  return (
    <Main>
      {React.Children.map(
        children,
        child =>
          child &&
          React.cloneElement(child, {
            ...state,
            dispatch,
            actionCreators,
          }),
      )}
    </Main>
  )
}

MainContent.displayName = 'MainContent'

export default MainContent
