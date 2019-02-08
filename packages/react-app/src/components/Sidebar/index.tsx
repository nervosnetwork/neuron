import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const SidebarAside = styled.div`
  background-color: #4cbc8e;
  height: 100%;
  h2 {
    margin: 0;
  }
`

const Sidebar = () => (
  <SidebarAside>
    <h2>Accounts</h2>
  </SidebarAside>
)

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
