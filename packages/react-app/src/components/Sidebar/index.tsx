import React from 'react'
import styled from 'styled-components'

const SidebarAside = styled.aside`
  flex: 0 0 240px;
  padding: 20px;
  width: 240px;
  background-color: #4cbc8e;
`

const Sidebar = () => (
  <SidebarAside>
    <h2>Accounts</h2>
  </SidebarAside>
)

export default Sidebar
