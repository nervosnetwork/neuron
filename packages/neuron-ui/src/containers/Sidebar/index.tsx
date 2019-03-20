import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
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
      div {
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
        &:focus {
          outline: none;
        }
      }
    }
  }
`

const walletMenuItems = [
  {
    name: 'siderbar.wallet',
    route: 'Wallet',
    icon: IconWallet,
  },
  {
    name: 'siderbar.send',
    route: 'Send',
    icon: IconSend,
  },
  {
    name: 'siderbar.receive',
    route: 'Receive',
    icon: IconReceive,
  },
  {
    name: 'siderbar.history',
    route: 'History',
    icon: IconHistory,
  },
  {
    name: 'siderbar.addresses',
    route: 'Addresses',
    icon: IconAddresses,
  },
  {
    name: 'siderbar.settings',
    route: 'Settings',
    icon: IconSettings,
  },
]

const Sidebar = (props: any) => {
  const wallet = useContext(WalletContext)
  const [t] = useTranslation()

  const walletRoutes = walletMenuItems.map(item => {
    const entry = mainContents.find(route => route.name === item.route)!
    return {
      icon: item.icon,
      ...entry,
      name: item.name,
    }
  })
  let menu
  if (wallet) {
    menu = walletRoutes.map(route => {
      const className = props.history.location.pathname.startsWith(route.path) ? 'active' : ''
      return (
        <li key={route.name}>
          <div
            className={className}
            role="menu"
            tabIndex={0}
            onClick={() => props.history.push(route.path)}
            onKeyPress={() => props.history.push(route.path)}
          >
            {<route.icon size="20px" />}
            <span>{route.name === 'Wallet' ? wallet.name : t(route.name)}</span>
          </div>
        </li>
      )
    })
  }

  return (
    <SidebarAside>
      <ul>{menu}</ul>
    </SidebarAside>
  )
}

const Container = (props: any) => createPortal(<Sidebar {...props} />, document.querySelector('aside') as HTMLElement)

export default Container
