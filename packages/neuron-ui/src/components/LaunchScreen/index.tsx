import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, PanelType, SpinnerSize } from 'office-ui-fabric-react'
import Spinner from 'widgets/Spinner'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { Routes } from 'utils/const'

export const LaunchScreen = ({ wallet: { id = '' } }: React.PropsWithoutRef<StateWithDispatch>) => {
  const { t } = useTranslation()
  const history = useHistory()

  useEffect(() => {
    if (id) {
      history.push(Routes.Overview)
    }
  }, [id, history])

  return (
    <Panel isOpen type={PanelType.custom} customWidth="100vw">
      <Spinner label={t('launch-screen.loading-wallets')} size={SpinnerSize.large} />
    </Panel>
  )
}

LaunchScreen.displayName = 'LaunchScreen'

export default LaunchScreen
