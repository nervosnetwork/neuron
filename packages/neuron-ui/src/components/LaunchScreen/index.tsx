import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import Screen from 'widgets/Screen'
import { Spinner } from 'widgets/Loading'
import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'

const LaunchScreen = ({ history }: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    wallet: { id },
    settings: { networks },
  } = useNeuronWallet()

  useEffect(() => {
    if (!networks.length) return
    if (id) {
      history.push(Routes.Wallet)
    } else {
      history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
    }
  }, [networks.length, id, history])

  return (
    <Screen>
      <Spinner frontColor="rgba(0, 0, 255, 0.5)" backgroundColor="transparent" size="30px" bandSize="5px" />
    </Screen>
  )
}

LaunchScreen.displayName = 'LaunchScreen'

export default LaunchScreen
