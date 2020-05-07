import React from 'react'
import { createPortal } from 'react-dom'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states/stateProvider'

import NetworkStatus from 'components/NetworkStatus'
import SyncStatus from 'components/SyncStatus'
import { ReactComponent as ExperimentalIcon } from 'widgets/Icons/Flask.svg'

import getSyncStatus from 'utils/getSyncStatus'
import getCurrentUrl from 'utils/getCurrentUrl'
import { Routes, FULL_SCREENS } from 'utils/const'

import styles from './navbar.module.scss'

const menuItems = [
  { name: 'navbar.overview', key: Routes.Overview, url: Routes.Overview, experimental: false },
  { name: 'navbar.send', key: Routes.Send, url: Routes.Send, experimental: false },
  { name: 'navbar.receive', key: Routes.Receive, url: Routes.Receive, experimental: false },
  { name: 'navbar.history', key: Routes.History, url: Routes.History, experimental: false },
  { name: 'navbar.nervos-dao', key: Routes.NervosDAO, url: Routes.NervosDAO, experimental: false },
  { name: 'navbar.special-assets', key: Routes.SpecialAssets, url: Routes.SpecialAssets, experimental: true },
  { name: 'navbar.s-udt', key: Routes.SUDTAccountList, url: Routes.SUDTAccountList, experimental: true },
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

  const selectedKey = menuItems.find(item => item.key === pathname)?.key ?? null

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

  const networkName = networks.find(n => n.id === networkID)?.name ?? null

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
          onAction={() => history.push(Routes.SettingsNetworks)}
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
