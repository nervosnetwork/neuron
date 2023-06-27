import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, PanelType } from 'office-ui-fabric-react'
import { useState as useGlobalState } from 'states'
import { RoutePath } from 'utils'
import Spinner, { SpinnerSize } from 'widgets/Spinner'

export const LaunchScreen = () => {
  const {
    wallet: { id = '' },
  } = useGlobalState()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      navigate(RoutePath.Overview)
    }
  }, [id, navigate])

  return (
    <Panel isOpen type={PanelType.custom} customWidth="100vw">
      <Spinner label={t('launch-screen.loading-wallets')} size={SpinnerSize.large} />
    </Panel>
  )
}

LaunchScreen.displayName = 'LaunchScreen'

export default LaunchScreen
