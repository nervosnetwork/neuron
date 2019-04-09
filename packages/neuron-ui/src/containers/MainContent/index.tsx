import React, { useReducer, useEffect } from 'react'
import styled from 'styled-components'

import { initState, reducer, MainDispatch, InitState } from './reducer'
import MainActions from './actions'
import { useNeuronWallet } from '../../utils/hooks'

const Main = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding-top: 50px;
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
  const { pageNo, pageSize, addresses, items } = transactions

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
  }, [pageNo, pageSize, addresses.join(','), items.map(item => item.hash).join(',')])

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
          }),
      )}
    </Main>
  )
}

MainContent.displayName = 'MainContent'

export default MainContent
