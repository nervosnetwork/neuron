import React from 'react'
import { createPortal } from 'react-dom'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states/stateProvider'

import NetworkStatus from 'components/NetworkStatus'
import SyncStatus from 'components/SyncStatus'

import getSyncStatus from 'utils/getSyncStatus'
import { Routes, FULL_SCREENS } from 'utils/const'

import styles from './navbar.module.scss'

const menuItems = [
  { name: 'navbar.overview', key: Routes.Overview.slice(1), url: Routes.Overview },
  { name: 'navbar.send', key: Routes.Send.slice(1), url: Routes.Send },
  { name: 'navbar.receive', key: Routes.Receive.slice(1), url: Routes.Receive },
  { name: 'navbar.history', key: Routes.History.slice(1), url: Routes.History },
  { name: 'navbar.nervos-dao', key: Routes.NervosDAO.slice(1), url: Routes.NervosDAO },
  { name: 'navbar.addresses', key: Routes.Addresses.slice(1), url: Routes.Addresses },
  { name: 'navbar.settings', key: Routes.Settings.slice(1), url: Routes.SettingsGeneral },
]

const Navbar = () => {
  const history = useHistory()
  const { pathname } = useLocation()
  const neuronWallet = useGlobalState()
  const {
    wallet: { name },
    app: { tipBlockNumber = '0', tipBlockTimestamp },
    chain: { connectionStatus, networkID, tipBlockNumber: syncedBlockNumber = '0' },
    settings: { wallets = [], networks = [] },
  } = neuronWallet
  const [t] = useTranslation()

  const selectedTab = menuItems.find(item => item.key === pathname.split('/')[1])
  const selectedKey: string | null = selectedTab ? selectedTab.key : null

  const syncStatus = getSyncStatus({
    syncedBlockNumber,
    tipBlockNumber,
    tipBlockTimestamp,
    currentTimestamp: Date.now(),
  })

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
      <button
        type="button"
        className={styles.name}
        title={name}
        aria-label={name}
        onClick={() => history.push(Routes.SettingsWallets)}
      >
        {name}
      </button>
      <nav role="navigation" className={styles.navs}>
        {menus}
      </nav>
      <NetworkStatus
        syncStatus={syncStatus}
        networkName={networkName}
        connectionStatus={connectionStatus}
        onAction={() => history.push(Routes.SettingsNetworks)}
      />
      <SyncStatus syncStatus={syncStatus} connectionStatus={connectionStatus} />
    </aside>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
