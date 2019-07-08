import React, { useCallback } from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Pivot, PivotItem, PrimaryButton } from 'office-ui-fabric-react'

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

const Settings = ({
  location,
  history,
  dispatch,
  ...neuronWalletState
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const goToOverview = useCallback(() => {
    history.push(Routes.Overview)
  }, [history])

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Text variant="large">{t('navbar.settings')}</Text>
      <Pivot
        selectedKey={location.pathname}
        onLinkClick={(pivotItem?: PivotItem) => {
          if (pivotItem && pivotItem.props && pivotItem.props.itemKey) {
            history.push(pivotItem.props.itemKey)
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
          render={routerProps => {
            return <container.comp {...neuronWalletState} {...routerProps} dispatch={dispatch} />
          }}
        />
      ))}
      <Stack horizontalAlign="start">
        <PrimaryButton onClick={goToOverview} text={t('settings.go-to-overview')} />
      </Stack>
    </Stack>
  )
}

Settings.displayName = 'Settings'

export default Settings
