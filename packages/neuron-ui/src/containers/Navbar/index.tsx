import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Pivot, PivotItem, PivotLinkFormat, PivotLinkSize, getTheme } from 'office-ui-fabric-react'
import {
  Local as IconGeneral,
  Upload as IconSend,
  Download as IconReceive,
  History as IconHistory,
  Database as IconAddresses,
} from 'grommet-icons'
import { useTranslation } from 'react-i18next'

import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'

const menuItems = [
  { name: 'navbar.general', url: Routes.General, icon: IconGeneral },
  { name: 'navbar.send', url: Routes.Send, icon: IconSend },
  { name: 'navbar.receive', url: Routes.Receive, icon: IconReceive },
  { name: 'navbar.history', url: Routes.History, icon: IconHistory },
  { name: 'navbar.addresses', url: Routes.Addresses, icon: IconAddresses },
]

const Navbar = ({ location, history }: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    settings: { wallets, showAddressBook },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const pivotItems = useMemo(
    () =>
      showAddressBook || location.pathname === Routes.Addresses ? menuItems : menuItems.slice(0, menuItems.length - 1),
    [showAddressBook]
  )

  if (!wallets.length) return null

  const theme = getTheme()
  const styles = {
    root: [
      {
        background: theme.palette.neutralLighter,
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

  return (
    <Pivot
      selectedKey={location.pathname}
      onLinkClick={(pivotItem?: PivotItem) => {
        if (pivotItem && pivotItem.props && pivotItem.props.itemKey) {
          history.push(pivotItem.props.itemKey)
        }
      }}
      headersOnly
      linkFormat={PivotLinkFormat.tabs}
      linkSize={PivotLinkSize.large}
      styles={styles}
    >
      {pivotItems.map(pivotItem => (
        <PivotItem key={pivotItem.name} headerText={t(pivotItem.name)} itemKey={pivotItem.url} />
      ))}
    </Pivot>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
