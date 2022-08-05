import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'

import { openExternal, showSettings } from 'services/remote'

import NetworkStatus from 'components/NetworkStatus'
import SyncStatus from 'components/SyncStatus'
import RingProgresBar from 'widgets/RingProgressBar'
import { ReactComponent as ExperimentalIcon } from 'widgets/Icons/Flask.svg'

import {
  RoutePath,
  getSyncLeftTime,
  localNumberFormatter,
  useOnLocaleChange,
  SyncStatus as SyncStatusEnum,
  ConnectionStatus,
  getExplorerUrl,
  isMainnet,
} from 'utils'

import styles from './navbar.module.scss'

export const FULL_SCREENS = [`${RoutePath.Transaction}/`, `/wizard/`, `/keystore/`, RoutePath.ImportHardware]

const throttledShowSettings = (() => {
  const THROTTLE_TIME = 1000
  let lastRun = 0
  return (params: Parameters<typeof showSettings>[0]) => {
    if (Date.now() - lastRun < THROTTLE_TIME) {
      return false
    }
    lastRun = Date.now()
    return showSettings(params)
  }
})()

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
  { name: 'navbar.s-udt', key: RoutePath.SUDTAccountList.slice(1), url: RoutePath.SUDTAccountList, experimental: true },
]

const Navbar = () => {
  const history = useHistory()
  const { pathname } = useLocation()
  const neuronWallet = useGlobalState()
  const {
    wallet: { name },
    chain: {
      connectionStatus,
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, estimate, status, isLookingValidTarget, validTarget },
    },
    settings: { wallets = [], networks = [] },
  } = neuronWallet
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)

  const network = networks.find(n => n.id === networkID)

  const selectedKey = menuItems.find(item => item.key === pathname.substr(1))?.key ?? null

  const syncStatus = status

  const onOpenValidTarget = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation()
      const explorerUrl = getExplorerUrl(isMainnet(networks, networkID))
      openExternal(`${explorerUrl}/block/${validTarget}`)
    },
    [networks, networkID, validTarget]
  )

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

  const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)
  const syncPercents =
    bestBlockNumber > 0 && cacheTipBlockNumber > 0 ? +((cacheTipBlockNumber * 100) / bestBlockNumber).toFixed(2) : 0
  let ringBarColor = '#3cc68a'
  if (ConnectionStatus.Offline === connectionStatus || SyncStatusEnum.SyncNotStart === syncStatus) {
    ringBarColor = '#ff0000'
  } else if (SyncStatusEnum.SyncPending === syncStatus) {
    ringBarColor = '#f7ae4d'
  }

  const syncBlockNumbers = `${cacheTipBlockNumber >= 0 ? localNumberFormatter(cacheTipBlockNumber) : '-'}/${
    bestBlockNumber >= 0 ? localNumberFormatter(bestBlockNumber) : '-'
  }`

  return (
    <aside className={styles.sidebar}>
      <button
        type="button"
        className={styles.name}
        title={name}
        aria-label={name}
        onClick={() => throttledShowSettings({ tab: 'wallets' })}
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
          isLookingValidTarget={isLookingValidTarget}
          onOpenValidTarget={onOpenValidTarget}
          syncPercents={syncPercents}
          syncBlockNumbers={syncBlockNumbers}
          network={network}
          onAction={() => throttledShowSettings({ tab: 'networks' })}
        />
      </div>
      <div className={styles.sync}>
        <RingProgresBar
          percents={syncPercents}
          color={ringBarColor}
          backgroundColor="#666"
          size="16px"
          strokeWidth="4px"
        />
        <SyncStatus syncStatus={syncStatus} connectionStatus={connectionStatus} leftTime={getSyncLeftTime(estimate)} />
      </div>
    </aside>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
