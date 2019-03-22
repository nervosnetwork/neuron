import React, { useReducer } from 'react'
import styled from 'styled-components'

import { initState, reducer, MainDispatch, InitState } from './reducer'

const Main = styled.main`
  height: 100%;
  width: 100%;
`

export interface ContentProps extends InitState {
  dispatch: MainDispatch
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
    </Main>
  )
}

MainContent.displayName = 'MainContent'

export default MainContent
