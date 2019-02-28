import React from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import NetworkStatusHeader from '../../components/Network'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
`

const Header: React.SFC<RouteComponentProps<{}>> = () => (
  <AppHeader>
    <NetworkStatusHeader />
  </AppHeader>
)

const Container: React.SFC<RouteComponentProps<{}>> = props =>
  createPortal(<Header {...props} />, document.querySelector('.header') as HTMLElement)

export default Container
