import React from 'react'
import { Route, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Pivot, PivotItem } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

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
    comp: GeneralSetting,
  },
  {
    name: `WalletsSetting`,
    path: Routes.SettingsWallets,
    exact: false,
    comp: Wallets,
  },
  {
    name: `NetworkSetting`,
    path: Routes.SettingsNetworks,
    exact: true,
    comp: NetworkSetting,
  },
]

const Settings = ({ dispatch, ...neuronWalletState }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const history = useHistory()
  const location = useLocation()

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
          render={() => <container.comp {...neuronWalletState} dispatch={dispatch} />}
        />
      ))}
    </Stack>
  )
}

Settings.displayName = 'Settings'

export default Settings
