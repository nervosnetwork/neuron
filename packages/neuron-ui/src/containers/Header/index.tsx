import React from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`

const Header = () => {
  return <AppHeader />
}

const Container: React.SFC<RouteComponentProps<{}>> = () =>
  createPortal(<Header />, document.querySelector('.header') as HTMLElement)

export default Container
