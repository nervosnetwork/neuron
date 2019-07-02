import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Panel, PanelType, Spinner, SpinnerSize } from 'office-ui-fabric-react'
import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import { useTranslation } from 'react-i18next'

const LaunchScreen = ({ history }: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    wallet: { id },
    settings: { networks },
  } = useNeuronWallet()
  const { t } = useTranslation()

  useEffect(() => {
    if (!networks.length) return
    if (id) {
      history.push(Routes.General)
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
