import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Disc } from 'grommet-icons'
import { routes } from '../Router'

const SidebarAside = styled.div`
  ul {
    margin: 0;
    list-style: none;
    li {
      margin: 10px 0;
    }
    a {
      display: flex;
      align-items: center;
      text-decoration: none;
    }
  }
`

const Sidebar = () => (
  <SidebarAside>
    <ul>
      <h2>My Wallet #1</h2>
      {routes
        .filter(route => route.showInSidebar)
        .map(route => (
          <li>
            <Link to={route.path}>
              <Disc />
              {route.name}
            </Link>
          </li>
        ))}
    </ul>
  </SidebarAside>
)

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
