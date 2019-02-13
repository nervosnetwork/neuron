import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import NetworkStatusHeader from '../../components/Network'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
`

const Header = () => (
  <AppHeader>
    <NetworkStatusHeader />
  </AppHeader>
)
const Container = () => createPortal(<Header />, document.querySelector('.header') as HTMLElement)

export default Container
