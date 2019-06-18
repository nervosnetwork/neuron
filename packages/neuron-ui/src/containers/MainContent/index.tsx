import React, { useReducer, useEffect } from 'react'
import styled from 'styled-components'

import { useNeuronWallet } from 'utils/hooks'
import { initState, reducer, MainDispatch, InitState } from './reducer'
import MainActions from './actions'

const Main = styled.main`
  display: flex;
  flex-direction: column;
  height: calc(100% -100px);
  width: 100%;
  padding-top: 50px;
  box-sizing: border-box;
`

export interface ContentProps extends InitState {
  dispatch: MainDispatch
  providerDispatch: any
}

const MainContent = ({
  providerDispatch,
  children,
}: React.PropsWithoutRef<{ providerDispatch: any; children?: any }>) => {
  const [state, dispatch] = useReducer(reducer, initState)
  const {
    chain: { transaction, transactions },
  } = useNeuronWallet()
  const { pageNo, pageSize, items } = transactions

  useEffect(() => {
    dispatch({
      type: MainActions.UpdateLoading,
      payload: { transaction: false },
    })
  }, [transaction.hash])

  useEffect(() => {
    dispatch({
      type: MainActions.UpdateLoading,
      payload: { transactions: false },
    })
  }, [pageNo, pageSize, items])

  return (
    <Main>
      {React.Children.map(
        children,
        child =>
          child &&
          React.cloneElement(child, {
            ...state,
            providerDispatch,
            dispatch,
          })
      )}
    </Main>
  )
}

MainContent.displayName = 'MainContent'

export default MainContent
