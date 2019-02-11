import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
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
      padding: 5px;
      text-decoration: none;
      color: #666666;
      span {
        padding-left: 10px;
      }
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
          <li key={route.name}>
            <Link to={route.path}>
              {route.icon ? <route.icon size="20px" /> : null}
              <span>{route.name}</span>
            </Link>
          </li>
        ))}
    </ul>
  </SidebarAside>
)

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
