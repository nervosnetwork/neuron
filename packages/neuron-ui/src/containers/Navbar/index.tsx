import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Pivot, PivotItem, PivotLinkFormat, PivotLinkSize, getTheme } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'states/stateProvider'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes, FULL_SCREENS } from 'utils/const'

const menuItems = [
  { name: 'navbar.general', key: Routes.General.slice(1), url: Routes.General },
  { name: 'navbar.send', key: Routes.Send.slice(1), url: Routes.Send },
  { name: 'navbar.receive', key: Routes.Receive.slice(1), url: Routes.Receive },
  { name: 'navbar.history', key: Routes.History.slice(1), url: Routes.History },
  { name: 'navbar.settings', key: Routes.Settings.slice(1), url: Routes.SettingsGeneral },
  { name: 'navbar.addresses', key: Routes.Addresses.slice(1), url: Routes.Addresses },
]

const theme = getTheme()
const styles = {
  root: [
    {
      background: theme.palette.neutralLighter,
      height: '44px',
    },
  ],
  link: [
    {
      padding: '0 30px',
    },
  ],
  linkIsSelected: [
    {
      padding: '0 30px',
    },
  ],
}

const Navbar = ({
  location: { pathname },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const neuronWallet = useState()
  const {
    settings: { wallets = [], showAddressBook = false },
  } = neuronWallet
  const [t] = useTranslation()

  const pivotItems = useMemo(
    () => (showAddressBook || pathname === Routes.Addresses ? menuItems : menuItems.slice(0, menuItems.length - 1)),
    [showAddressBook, pathname]
  )

  if (!wallets.length || FULL_SCREENS.find(url => pathname.startsWith(url))) return null

  return (
    <Pivot
      selectedKey={pathname.split('/')[1]}
      onLinkClick={(pivotItem?: PivotItem) => {
        if (pivotItem && pivotItem.props) {
          const linkDesc = Object.getOwnPropertyDescriptor(pivotItem.props, 'data-link')
          if (linkDesc && typeof linkDesc.value === 'string') {
            history.push(linkDesc.value)
          }
        }
      }}
      headersOnly
      linkFormat={PivotLinkFormat.tabs}
      linkSize={PivotLinkSize.large}
      styles={styles}
    >
      {pivotItems.map(pivotItem => (
        <PivotItem
          headerText={t(pivotItem.name)}
          itemKey={pivotItem.key}
          key={pivotItem.key}
          data-link={pivotItem.url}
        />
      ))}
    </Pivot>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
