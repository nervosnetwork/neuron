import React, { useEffect, useCallback, useReducer } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import { setNetwork } from '../../services/UILayer'
import NetworkStatusHeader from '../../components/Network'
import { Network } from '../../contexts/Chain'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`
const defaultNetworks = (() => {
  const { REACT_APP_NETWORKS } = process.env
  if (REACT_APP_NETWORKS) {
    return JSON.parse(REACT_APP_NETWORKS)
  }
  return []
})()

const reducer = (state: any, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'setNetworks': {
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

const actionCreators = {
  setNetowrk: (network: Network) => {
    setNetwork(network)
    return {
      type: 'setNetwork',
    }
  },
}
export type HeaderActionsCreators = typeof actionCreators
export type HeaderDispatch = React.Dispatch<{ type: string; payload?: any }>

const Header = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const [header, dispatch] = useReducer(reducer, {
    networks: defaultNetworks,
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
            type: 'setNetworks',
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
        networks={header.networks}
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
