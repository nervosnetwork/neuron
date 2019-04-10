import React, { useEffect, useCallback, useReducer } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import NetworkStatusHeader from '../../components/Network'
import { initState, reducer, HeaderActions } from './reducer'
import { useNeuronWallet } from '../../utils/hooks'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`

const Header = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const { settings } = useNeuronWallet()

  const [header, dispatch] = useReducer(reducer, {
    ...initState,
    networks: settings.networks,
  })

  const navTo = useCallback((path: string) => {
    props.history.push(path)
  }, [])

  useEffect(() => {
    let cachedNetworks = window.localStorage.getItem('networks')
    if (cachedNetworks) {
      try {
        cachedNetworks = JSON.parse(cachedNetworks)
        if (cachedNetworks && cachedNetworks.length) {
          dispatch({
            type: HeaderActions.SetNetwork,
            payload: [...new Set([...header.networks, ...cachedNetworks])],
          })
        }
      } catch (err) {
        console.error('Invalid Cached Networks')
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
