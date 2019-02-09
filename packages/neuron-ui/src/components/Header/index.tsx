import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import NetworkStatusHeader from '../Network'

const AppHeader = styled.div`
  width: 100%;
  background: #ccc;
  border-bottom: solid 1px #ccc;
`

const Header = () => (
  <AppHeader>
    <div>Header goes here</div>
    <NetworkStatusHeader />
    <div>Misc</div>
  </AppHeader>
)
const Container = () => createPortal(<Header />, document.querySelector('header') as HTMLElement)

export default Container
