import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, PanelType, Spinner, SpinnerSize } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { WalletWizardPath } from 'components/WalletWizard'
import { Routes } from 'utils/const'

export const LaunchScreen = ({
  wallet: { id = '' },
  settings: { networks = [] },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (!networks.length) return
    if (id) {
      history.push(Routes.Overview)
    } else {
      history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
    }
  }, [networks.length, id, history])

  return (
    <Panel isOpen type={PanelType.custom} customWidth="100vw">
      <Spinner label={t('launch-screen.loading-wallets')} size={SpinnerSize.large} />
    </Panel>
  )
}

LaunchScreen.displayName = 'LaunchScreen'

export default LaunchScreen
