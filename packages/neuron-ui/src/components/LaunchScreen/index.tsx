import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import Screen from '../../widgets/Screen'
import { Spinner } from '../../widgets/Loading'
import { useNeuronWallet } from '../../utils/hooks'
import { Routes } from '../../utils/const'

const LaunchScreen = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    wallet,
    settings: { networks },
  } = useNeuronWallet()

  useEffect(() => {
    if (!networks.length) return
    if (wallet.id) {
      props.history.push(Routes.Wallet)
    } else {
      props.history.push(Routes.WalletWizard)
    }
  }, [networks.length])

  return (
    <Screen>
      <Spinner frontColor="rgba(0, 0, 255, 0.5)" backgroundColor="transparent" size="30px" bandSize="5px" />
    </Screen>
  )
}

LaunchScreen.displayName = 'LaunchScreen'

export default LaunchScreen
