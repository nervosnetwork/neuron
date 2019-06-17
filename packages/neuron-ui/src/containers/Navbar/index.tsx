import React from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import {
  Upload as IconSend,
  Download as IconReceive,
  History as IconHistory,
  Database as IconAddresses,
} from 'grommet-icons'
import { useTranslation } from 'react-i18next'

import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'

const menuItems = [
  { name: 'navbar.send', route: Routes.Send, icon: IconSend },
  { name: 'navbar.receive', route: Routes.Receive, icon: IconReceive },
  { name: 'navbar.history', route: Routes.History, icon: IconHistory },
  { name: 'navbar.addresses', route: Routes.Addresses, icon: IconAddresses },
]

const Sidebar = () => {
  const {
    settings: { wallets, showAddressBook },
  } = useNeuronWallet()
  const [t] = useTranslation()

  return wallets.length ? (
    <>
      {(showAddressBook ? menuItems : menuItems.slice(0, 3)).map(menuItem => (
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
          {<menuItem.icon size="20px" style={{ paddingRight: '5px' }} />}
          {t(menuItem.name)}
        </NavLink>
      ))}
    </>
  ) : null
}

const Container = (props: any) => createPortal(<Sidebar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
