import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, PanelType, SpinnerSize } from 'office-ui-fabric-react'
import { useState as useGlobalState } from 'states/stateProvider'
import Spinner from 'widgets/Spinner'

import { Routes } from 'utils/const'

export const LaunchScreen = () => {
  const {
    wallet: { id = '' },
  } = useGlobalState()
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
