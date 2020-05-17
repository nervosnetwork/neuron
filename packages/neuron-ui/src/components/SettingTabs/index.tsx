import React, { useMemo } from 'react'
import { Route, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pivot, PivotItem } from 'office-ui-fabric-react'

import { useState as useGloablState, useDispatch } from 'states'

import GeneralSetting from 'components/GeneralSetting'
import WalletSetting from 'components/WalletSetting'
import NetworkSetting from 'components/NetworkSetting'

import { getPlatform } from 'services/remote'
import { RoutePath } from 'utils'

import styles from './settingTabs.module.scss'

const pivotItems = [
  { label: 'settings.setting-tabs.general', url: RoutePath.SettingsGeneral },
  { label: 'settings.setting-tabs.wallets', url: RoutePath.SettingsWallets },
  { label: 'settings.setting-tabs.network', url: RoutePath.SettingsNetworks },
]

const settingPanels: CustomRouter.Route[] = [
  { name: `GeneralSetting`, path: RoutePath.SettingsGeneral, exact: false, component: GeneralSetting },
  { name: `WalletsSetting`, path: RoutePath.SettingsWallets, exact: false, component: WalletSetting },
  { name: `NetworkSetting`, path: RoutePath.SettingsNetworks, exact: true, component: NetworkSetting },
]

const SettingsTabs = () => {
  const [t] = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const globalState = useGloablState()
  const dispatch = useDispatch()
  const isMac = useMemo(() => {
    return getPlatform() === 'darwin'
  }, [])

  return (
    <div>
      <h1 className={styles.title}>{t(`settings.title.${isMac ? 'mac' : 'normal'}`)}</h1>
      <Pivot
        selectedKey={location.pathname}
        onLinkClick={(pivotItem?: PivotItem) => {
          if (pivotItem && pivotItem.props && pivotItem.props.itemKey) {
            history.replace(pivotItem.props.itemKey)
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

      {settingPanels.map(container => (
        <Route
          exact={container.exact}
          path={`${container.path}${container.params || ''}`}
          key={container.name}
          render={() => <container.component {...globalState} dispatch={dispatch} />}
        />
      ))}
    </div>
  )
}

SettingsTabs.displayName = 'SettingsTabs'

export default SettingsTabs
