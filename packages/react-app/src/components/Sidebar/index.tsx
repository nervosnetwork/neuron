import React from 'react'
import styled from 'styled-components'

const SidebarWrapper = styled.aside`
  padding: 20px;
  width: 240px;
  flex: 0 0 240px;
  background-color: #4cbc8e;
`

const Sidebar = () => (
  <SidebarWrapper>
    <h2>Accounts</h2>
  </SidebarWrapper>
)

export default Sidebar
