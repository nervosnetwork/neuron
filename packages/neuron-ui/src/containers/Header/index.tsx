import React, { useEffect, useCallback, useReducer, useContext } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import NetworkStatusHeader from '../../components/Network'
import SettingsContext from '../../contexts/Settings'
import { initState, reducer, HeaderActions } from './reducer'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`

const Header = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const settings = useContext(SettingsContext)

  const [header, dispatch] = useReducer(reducer, {
    ...initState,
    networks: settings.networks,
  })

  const navTo = useCallback((path: string) => {
    props.history.push(path)
  }, [])

  useEffect(() => {
    let cachedNetowrks = window.localStorage.getItem('networks')
    if (cachedNetowrks) {
      try {
        cachedNetowrks = JSON.parse(cachedNetowrks)
        if (cachedNetowrks && cachedNetowrks.length) {
          dispatch({
            type: HeaderActions.SetNetwork,
            payload: [...new Set([...header.networks, ...cachedNetowrks])],
          })
        }
      } catch (err) {
        console.error('Invalid Cached Netowrks')
      }
    }
  }, [])

  return (
    <AppHeader>
      <NetworkStatusHeader networks={settings.networks} navTo={navTo} dispatch={dispatch} />
    </AppHeader>
  )
}

const Container: React.SFC<RouteComponentProps<{}>> = props =>
  createPortal(<Header {...props} />, document.querySelector('.header') as HTMLElement)

export default Container
