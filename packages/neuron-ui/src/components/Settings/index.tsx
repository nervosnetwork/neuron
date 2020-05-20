import React from 'react'
import { Route, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Pivot, PivotItem } from 'office-ui-fabric-react'

import { useState as useGloablState, useDispatch } from 'states'

import GeneralSetting from 'components/GeneralSetting'
import Wallets from 'components/WalletSetting'
import NetworkSetting from 'components/NetworkSetting'

import { RoutePath } from 'utils'

const pivotItems = [
  { label: 'settings.setting-tabs.general', url: RoutePath.SettingsGeneral },
  { label: 'settings.setting-tabs.wallets', url: RoutePath.SettingsWallets },
  { label: 'settings.setting-tabs.network', url: RoutePath.SettingsNetworks },
]

const settingPanels: CustomRouter.Route[] = [
  {
    name: `GeneralSetting`,
    path: RoutePath.SettingsGeneral,
    exact: false,
    component: GeneralSetting,
  },
  {
    name: `WalletsSetting`,
    path: RoutePath.SettingsWallets,
    exact: false,
    component: Wallets,
  },
  {
    name: `NetworkSetting`,
    path: RoutePath.SettingsNetworks,
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
