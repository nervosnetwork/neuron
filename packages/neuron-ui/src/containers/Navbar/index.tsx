import React from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'states/stateProvider'

import NetworkStatus from 'components/NetworkStatus'
import SyncStatus from 'components/SyncStatus'

import { Routes, FULL_SCREENS } from 'utils/const'
import * as styles from './navbar.module.scss'

const menuItems = [
  { name: 'navbar.overview', key: Routes.Overview.slice(1), url: Routes.Overview },
  { name: 'navbar.send', key: Routes.Send.slice(1), url: Routes.Send },
  { name: 'navbar.receive', key: Routes.Receive.slice(1), url: Routes.Receive },
  { name: 'navbar.history', key: Routes.History.slice(1), url: Routes.History },
  { name: 'navbar.nervos-dao', key: Routes.NervosDAO.slice(1), url: Routes.NervosDAO },
  { name: 'navbar.addresses', key: Routes.Addresses.slice(1), url: Routes.Addresses },
  { name: 'navbar.settings', key: Routes.Settings.slice(1), url: Routes.SettingsGeneral },
]

const Navbar = ({ location: { pathname }, history }: RouteComponentProps) => {
  const neuronWallet = useState()
  const {
    wallet: { name },
    app: { tipBlockNumber = '0' },
    chain: { connectionStatus, networkID, tipBlockNumber: syncedBlockNumber = '0' },
    settings: { wallets = [], networks = [] },
  } = neuronWallet
  const [t] = useTranslation()

  const selectedTab = menuItems.find(item => item.key === pathname.split('/')[1])
  const selectedKey: string | null = selectedTab ? selectedTab.key : null

  if (!wallets.length || FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }

  const menus = menuItems.map(item => (
    <button
      type="button"
      key={item.key}
      title={t(item.name)}
      name={t(item.name)}
      aria-label={t(item.name)}
      data-link={item.url}
      data-active={item.key === selectedKey}
      onClick={() => history.push(item.url)}
    >
      {t(item.name)}
    </button>
  ))
  const currentNetwork = networks.find(n => n.id === networkID)

  const networkName = currentNetwork ? currentNetwork.name : null

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.name} title={name} aria-label={name}>
        {name}
      </h1>
      <nav role="navigation" className={styles.navs}>
        {menus}
      </nav>
      <NetworkStatus
        networkName={networkName}
        connectionStatus={connectionStatus}
        onAction={() => history.push(Routes.SettingsNetworks)}
      />
      <SyncStatus tipBlockNumber={tipBlockNumber} syncedBlockNumber={syncedBlockNumber} />
    </aside>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
