import React, { useReducer } from 'react'
import styled from 'styled-components'

import Dialog from '../../widgets/Dialog'
import { MainDispatch, InitState, initState, reducer, actionCreators, MainActions } from './reducer'

const Main = styled.main`
  height: 100%;
  width: 100%;
`

export interface ContentProps extends InitState {
  dispatch: MainDispatch
  actionCreators: typeof actionCreators
}

const MainContent = ({ children }: React.PropsWithoutRef<{ children?: any }>) => {
  const [state, dispatch] = useReducer(reducer, initState)

  return (
    <Main>
      {React.Children.map(
        children,
        child =>
          child &&
          React.cloneElement(child, {
            ...state,
            dispatch,
          }),
      )}
      <Dialog
        open={!!state.dialog}
        onClick={() => {
          dispatch({
            type: MainActions.SetDialog,
            payload: null,
          })
        }}
      >
        {state.dialog}
      </Dialog>
    </Main>
  )
}

MainContent.displayName = 'MainContent'

export default MainContent
