import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import {
  CreditCard as IconWallet,
  Upload as IconSend,
  Download as IconReceive,
  History as IconHistory,
  Database as IconAddresses,
  Performance as IconSettings,
} from 'grommet-icons'
import { useTranslation } from 'react-i18next'

import { mainContents } from '../../components/Router'
import WalletContext from '../../contexts/Wallet'

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

const walletMenuItems = [
  ['Wallet', IconWallet],
  ['Send', IconSend],
  ['Receive', IconReceive],
  ['History', IconHistory],
  ['Addresses', IconAddresses],
  ['Settings', IconSettings],
]

const Sidebar = () => {
  const wallet = useContext(WalletContext)
  const [t] = useTranslation()

  const walletRoutes = walletMenuItems.map(item => {
    const entry = mainContents.find(route => route.name === item[0])!
    return {
      icon: item[1],
      ...entry,
    }
  })
  let menu
  if (wallet) {
    menu = walletRoutes.map(route => (
      <li key={route.name}>
        <NavLink to={route.path}>
          {<route.icon size="20px" />}
          <span>{route.name === 'Wallet' ? wallet.name : t(route.name)}</span>
        </NavLink>
      </li>
    ))
  }

  return (
    <SidebarAside>
      <ul>{menu}</ul>
    </SidebarAside>
  )
}

const Container = () => createPortal(<Sidebar />, document.querySelector('aside') as HTMLElement)

export default Container
