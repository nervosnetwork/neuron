import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pivot, PivotItem } from 'office-ui-fabric-react'
import { Routes } from 'utils/const'

const pivotItems = [
  { label: 'settings.setting-tabs.general', url: Routes.SettingsGeneral },
  { label: 'settings.setting-tabs.wallets', url: Routes.SettingsWallets },
  { label: 'settings.setting-tabs.network', url: Routes.SettingsNetworks },
]

const Settings = ({ location, history }: React.PropsWithoutRef<RouteComponentProps>) => {
  const [t] = useTranslation()
  return (
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
  )
}

export default Settings
