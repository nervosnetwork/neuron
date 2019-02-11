import React from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { sidebarRoutes } from '../Router'

const SidebarAside = styled.div`
  ul {
    margin: 40px 0 0 0;
    padding: 0 32px;
    list-style: none;
    li {
      margin: 10px 0;
    }
    a {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 4px;
      text-decoration: none;
      color: #666666;
      span {
        padding-left: 10px;
      }
      &.active {
        background-color: #eee;
        font-weight: 600;
      }
    }
  }
`

const Sidebar = () => (
  <SidebarAside>
    <ul>
      {sidebarRoutes.map(route => (
        <li key={route.name}>
          <NavLink to={route.path}>
            {route.icon ? <route.icon size="20px" /> : null}
            <span>{route.name}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </SidebarAside>
)

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
