import React, { useMemo } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pivot, PivotItem } from 'office-ui-fabric-react'
import { getPlatform } from 'services/remote'
import { RoutePath } from 'utils'

import styles from './settingTabs.module.scss'

const pivotItems = [
  { label: 'settings.setting-tabs.general', url: `${RoutePath.Settings}/${RoutePath.SettingsGeneral}` },
  { label: 'settings.setting-tabs.wallets', url: `${RoutePath.Settings}/${RoutePath.SettingsWallets}` },
  { label: 'settings.setting-tabs.network', url: `${RoutePath.Settings}/${RoutePath.SettingsNetworks}` },
  { label: 'settings.setting-tabs.data', url: `${RoutePath.Settings}/${RoutePath.SettingsData}` },
]

const SettingsTabs = () => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isMac = useMemo(() => {
    return getPlatform() === 'darwin'
  }, [])

  return (
    <div className={styles.settingRoot}>
      <h1 className={styles.title}>{t(`settings.title.${isMac ? 'mac' : 'normal'}`)}</h1>
      <Pivot
        selectedKey={location.pathname}
        onLinkClick={(pivotItem?: PivotItem) => {
          if (pivotItem && pivotItem.props && pivotItem.props.itemKey) {
            navigate(pivotItem.props.itemKey)
          }
        }}
        headersOnly
        styles={{
          root: {
            borderBottom: '0.5px solid #ccc',
          },
        }}
      >
        {pivotItems.map(pivotItem => (
          <PivotItem key={pivotItem.url} headerText={t(pivotItem.label)} itemKey={pivotItem.url} />
        ))}
      </Pivot>
      <Outlet />
    </div>
  )
}

SettingsTabs.displayName = 'SettingsTabs'

export default SettingsTabs
