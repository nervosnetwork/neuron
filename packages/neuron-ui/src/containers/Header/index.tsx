import React from 'react'
import styled from 'styled-components'
import NetworkStatusHeader from '../../components/Network'

const AppHeader = styled.div.attrs(({ className }) => ({
  className,
}))`
  height: 100%;
  border-bottom: solid 1px #ccc;
`

const Header = () => (
  <AppHeader className="header">
    <NetworkStatusHeader />
  </AppHeader>
)

export default Header
