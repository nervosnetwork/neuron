import React from 'react'
import { createPortal } from 'react-dom'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'

import NetworkStatus from 'components/NetworkStatus'
import SyncStatus from 'components/SyncStatus'
import { ReactComponent as ExperimentalIcon } from 'widgets/Icons/Flask.svg'

import { RoutePath, getCurrentUrl, getSyncStatus } from 'utils'

import styles from './navbar.module.scss'

export const FULL_SCREENS = [`${RoutePath.Transaction}/`, `/wizard/`, `/keystore/`]

const menuItems = [
  { name: 'navbar.overview', key: RoutePath.Overview.slice(1), url: RoutePath.Overview, experimental: false },
  { name: 'navbar.send', key: RoutePath.Send.slice(1), url: RoutePath.Send, experimental: false },
  { name: 'navbar.receive', key: RoutePath.Receive.slice(1), url: RoutePath.Receive, experimental: false },
  { name: 'navbar.history', key: RoutePath.History.slice(1), url: RoutePath.History, experimental: false },
  { name: 'navbar.nervos-dao', key: RoutePath.NervosDAO.slice(1), url: RoutePath.NervosDAO, experimental: false },
  {
    name: 'navbar.special-assets',
    key: RoutePath.SpecialAssets.slice(1),
    url: RoutePath.SpecialAssets,
    experimental: true,
  },
  { name: 'navbar.addresses', key: RoutePath.Addresses.slice(1), url: RoutePath.Addresses, experimental: false },
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
    url: getCurrentUrl(networkID, networks),
  })

  if (!wallets.length || FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }

  const normalMenus = menuItems
    .filter(item => !item.experimental)
    .map(item => (
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

  const experimentalMenus = menuItems
    .filter(item => item.experimental)
    .map(item => (
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
        onClick={() => history.push(RoutePath.SettingsWallets)}
      >
        {name}
      </button>
      <nav role="navigation" className={styles.navs}>
        {normalMenus}
        <div className={styles.experimentalDivider}>
          <ExperimentalIcon />
          {t('navbar.experimental-functions')}
        </div>
        {experimentalMenus}
      </nav>
      <div className={styles.network}>
        <NetworkStatus
          syncStatus={syncStatus}
          tipBlockNumber={tipBlockNumber}
          syncedBlockNumber={syncedBlockNumber}
          networkName={networkName}
          connectionStatus={connectionStatus}
          onAction={() => history.push(RoutePath.SettingsNetworks)}
        />
      </div>
      <div className={styles.sync}>
        <SyncStatus syncStatus={syncStatus} connectionStatus={connectionStatus} />
      </div>
    </aside>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
