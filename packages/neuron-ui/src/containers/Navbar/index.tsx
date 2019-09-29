import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, Pivot, PivotItem, PivotLinkFormat, PivotLinkSize, IconButton, getTheme } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'states/stateProvider'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes, FULL_SCREENS } from 'utils/const'

const menuItems = [
  { name: 'navbar.overview', key: Routes.Overview.slice(1), url: Routes.Overview },
  { name: 'navbar.send', key: Routes.Send.slice(1), url: Routes.Send },
  { name: 'navbar.receive', key: Routes.Receive.slice(1), url: Routes.Receive },
  { name: 'navbar.history', key: Routes.History.slice(1), url: Routes.History },
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
    settings: {
      wallets = [],
      general: { showAddressBook = false },
    },
  } = neuronWallet
  const [t] = useTranslation()

  const pivotItems = useMemo(() => (showAddressBook ? menuItems : menuItems.slice(0, menuItems.length - 1)), [
    showAddressBook,
  ])

  const selectedKey = useMemo(() => {
    const selectedTab = pivotItems.find(item => item.key === pathname.split('/')[1])
    if (selectedTab) {
      return selectedTab.key
    }
    return null
  }, [pathname, pivotItems])

  if (!wallets.length || FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }

  return (
    <Stack horizontal horizontalAlign="space-between" verticalAlign="stretch">
      <Pivot
        selectedKey={selectedKey}
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
      <IconButton
        iconProps={{ iconName: 'Settings' }}
        onClick={() => history.push(Routes.SettingsGeneral)}
        styles={{
          root: {
            height: 'auto',
            width: '44px',
            marginRight: '8px',
          },
          icon: {
            height: '20px',
          },
        }}
      />
    </Stack>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
