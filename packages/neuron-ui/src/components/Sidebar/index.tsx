import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { routes } from '../Router'

const SidebarAside = styled.div`
  display: grid;
  background-color: #4cbc8e;
  height: 100%;
  h2 {
    margin: 0;
  }
`

const Sidebar = () => (
  <SidebarAside>
    {routes
      .filter(route => route.showInSidebar)
      .map(route => (
        <Link to={route.path}>{route.name}</Link>
      ))}
  </SidebarAside>
)

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
