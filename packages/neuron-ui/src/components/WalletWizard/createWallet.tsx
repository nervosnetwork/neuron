import React, { useContext, useEffect } from 'react'
import styled from 'styled-components'
import SettingsContext from '../../contexts/Settings'
import WalletContext from '../../contexts/Wallet'

import { Routes } from '../../utils/const'

import ActionFlow, { ActionStep } from '../ActionFlow'
import ActionA from './actionA'
import ActionB from './actionB'
import ActionC from './actionC'
import ActionD from './actionD'

const CreateWalletDiv = styled.div`
  box-sizing: border-box;
  padding-top: 20px;
  background-color: white;
  height: 100%;
  width: 100%;
`

export default (props: any) => {
  const settingsContext = useContext(SettingsContext)
  const walletContext = useContext(WalletContext)

  useEffect(() => {
    const content = document.querySelector('.main-content')
    if (content) {
      content.classList.add('full-screen')
      return () => {
        content.classList.remove('full-screen')
      }
    }
    return () => {}
  }, [])
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
        <ActionStep title="seed" onBeforeNext={() => settingsContext.seedsValid}>
          <ActionB />
        </ActionStep>
        <ActionStep
          title="password"
          onBeforeNext={() => settingsContext.passwordValid}
          onAfterNext={() => {
            // temp logic for simulate creation
            walletContext.name = settingsContext.name
            walletContext.address = settingsContext.seeds
          }}
        >
          <ActionC />
        </ActionStep>
        <ActionStep
          title="wallet"
          onAfterNext={() => {
            settingsContext.passwordValid = false
            props.history.push(Routes.WalletWizard)
          }}
        >
          <ActionD />
        </ActionStep>
      </ActionFlow>
    </CreateWalletDiv>
  )
}
