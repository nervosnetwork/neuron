import React from 'react'
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

import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'

const SidebarAside = styled.nav`
  display: flex;
  flex-direction: column;
  margin: 40px 0 0 0;
  padding: 0 32px;
  list-style: none;
  a {
    margin: 10px 0;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 4px;
    text-decoration: none;
    color: #666666;
  }
`

const menuItems = [
  { name: 'siderbar.wallet', route: Routes.Wallet, icon: IconWallet },
  { name: 'siderbar.send', route: Routes.Send, icon: IconSend },
  { name: 'siderbar.receive', route: Routes.Receive, icon: IconReceive },
  { name: 'siderbar.history', route: Routes.History, icon: IconHistory },
  { name: 'siderbar.addresses', route: Routes.Addresses, icon: IconAddresses },
  { name: 'siderbar.settings', route: Routes.Settings, icon: IconSettings },
]

const Sidebar = () => {
  const {
    wallet: { name },
  } = useNeuronWallet()
  const [t] = useTranslation()

  return (
    <SidebarAside>
      {menuItems.map(menuItem => (
        <NavLink
          key={menuItem.name}
          to={menuItem.route}
          isActive={match => {
            return !!match
          }}
          activeStyle={{
            backgroundColor: '#eee',
            fontWeight: 'bolder',
          }}
        >
          {menuItem.name === menuItems[0].name ? name : t(menuItem.name)}
        </NavLink>
      ))}
    </SidebarAside>
  )
}

const Container = (props: any) => createPortal(<Sidebar {...props} />, document.querySelector('aside') as HTMLElement)

export default Container
