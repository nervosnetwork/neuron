import React, { useContext, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import SettingsContext from '../../contexts/Settings'
import WalletContext from '../../contexts/Wallet'
import { ContentProps } from '../../containers/MainContent'
import { actionCreators } from '../../containers/MainContent/reducer'

import { Routes } from '../../utils/const'

import ActionFlow, { ActionStep } from '../ActionFlow'
import ActionA from './actionA'
import ActionB from './actionB'
import ActionC from './actionC'
import ActionD from './actionD'

const CreateWalletDiv = styled.div`
  box-sizing: border-box;
  background-color: white;
  height: 100%;
  width: 100%;
`

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const settings = useContext(SettingsContext)
  const wallet = useContext(WalletContext)

  useEffect(() => {
    const content = document.querySelector('.main-content')
    if (content && !wallet.address) {
      content.classList.add('full-screen')
      return () => {
        content.classList.remove('full-screen')
      }
    }
    return () => {}
  }, [wallet.address])
  return (
    <CreateWalletDiv>
      <ActionFlow>
        <ActionStep
          title="mnemonic"
          onAfterBack={() => {
            props.history.goBack()
          }}
        >
          <ActionA />
        </ActionStep>
        <ActionStep title="seed" onBeforeNext={() => settings.seedsValid}>
          <ActionB />
        </ActionStep>
        <ActionStep
          title="password"
          onBeforeNext={() => settings.passwordValid}
          onAfterNext={() => {
            // temp logic for simulate creation
            props.dispatch(
              actionCreators.createWallet({
                walletName: settings.name,
                password: '',
              }),
            )
          }}
        >
          <ActionC />
        </ActionStep>
        <ActionStep
          title="wallet"
          onAfterNext={() => {
            settings.passwordValid = false
            props.history.push(Routes.WalletWizard)
          }}
        >
          <ActionD />
        </ActionStep>
      </ActionFlow>
    </CreateWalletDiv>
  )
}
