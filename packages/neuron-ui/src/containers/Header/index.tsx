import React, { useEffect, useCallback, useReducer, useContext } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import { setNetwork } from '../../services/UILayer'
import NetworkStatusHeader from '../../components/Network'
import { Network } from '../../contexts/Chain'
import SettingsContext from '../../contexts/Settings'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`

export enum HeaderActions {
  SetNetwork,
}

const reducer = (state: any, action: { type: HeaderActions; payload?: any }) => {
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
    setNetwork(network)
    return {
      type: HeaderActions.SetNetwork,
      payload: network,
    }
  },
}

export type HeaderActionsCreators = typeof actionCreators
export type HeaderDispatch = React.Dispatch<{ type: string; payload?: any }>

const Header = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const settings = useContext(SettingsContext)

  const [header, dispatch] = useReducer(reducer, {
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
      <NetworkStatusHeader
        networks={settings.networks}
        navTo={navTo}
        dispatch={dispatch}
        actionCreators={actionCreators}
      />
    </AppHeader>
  )
}

const Container: React.SFC<RouteComponentProps<{}>> = props =>
  createPortal(<Header {...props} />, document.querySelector('.header') as HTMLElement)

export default Container
