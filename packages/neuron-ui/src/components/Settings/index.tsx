import React from 'react'
import { Route, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Pivot, PivotItem } from 'office-ui-fabric-react'

import { useState as useGloablState, useDispatch } from 'states/stateProvider'

import GeneralSetting from 'components/GeneralSetting'
import Wallets from 'components/WalletSetting'
import NetworkSetting from 'components/NetworkSetting'

import { Routes } from 'utils/const'

const pivotItems = [
  { label: 'settings.setting-tabs.general', url: Routes.SettingsGeneral },
  { label: 'settings.setting-tabs.wallets', url: Routes.SettingsWallets },
  { label: 'settings.setting-tabs.network', url: Routes.SettingsNetworks },
]

const settingPanels: CustomRouter.Route[] = [
  {
    name: `GeneralSetting`,
    path: Routes.SettingsGeneral,
    exact: false,
    component: GeneralSetting,
  },
  {
    name: `WalletsSetting`,
    path: Routes.SettingsWallets,
    exact: false,
    component: Wallets,
  },
  {
    name: `NetworkSetting`,
    path: Routes.SettingsNetworks,
    exact: true,
    component: NetworkSetting,
  },
]

const Settings = () => {
  const globalState = useGloablState()
  const dispatch = useDispatch()
  const history = useHistory()
  const location = useLocation()
  const [t] = useTranslation()

  return (
    <Stack tokens={{ childrenGap: 15, padding: '39px 0 0 0' }}>
      <Pivot
        selectedKey={location.pathname}
        onLinkClick={(pivotItem?: PivotItem) => {
          if (pivotItem && pivotItem.props && pivotItem.props.itemKey) {
            history.replace(pivotItem.props.itemKey)
          }
        }}
        headersOnly
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
    </Stack>
  )
}

Settings.displayName = 'Settings'

export default Settings
