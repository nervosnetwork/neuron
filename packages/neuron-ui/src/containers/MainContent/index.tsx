import React, { useReducer, useEffect, useContext } from 'react'
import styled from 'styled-components'

import ChainContext from '../../contexts/Chain'
import { initState, reducer, MainDispatch, InitState } from './reducer'
import MainActions from './actions'

const Main = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
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
  const chain = useContext(ChainContext)
  const { transaction, transactions } = chain
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
