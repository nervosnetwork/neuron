import React, { useContext } from 'react'
import styled from 'styled-components'
import SettingsContext from '../../contexts/settings'
import { Routes } from '../../utils/const'

import ActionFlow, { ActionStep } from '../ActionFlow'
import ActionB from './actionB'
import ActionC from './actionC'
import ActionD from './actionD'

const CreateWalletDiv = styled.div`
  padding-top: 20px;
  height: 100%;
  background-color: white;
  box-sizing: border-box;
`

export default (props: any) => {
  const settingsContext = useContext(SettingsContext)
  return (
    <CreateWalletDiv>
      <ActionFlow>
        <ActionStep
          title="seed"
          onAfterBack={() => {
            props.history.goBack()
          }}
        >
          <ActionB />
        </ActionStep>
        <ActionStep
          title="password"
          onBeforeNext={() => settingsContext.passwordValid}
        >
          <ActionC />
        </ActionStep>
        <ActionStep
          title="wallet"
          onAfterNext={() => {
            settingsContext.passwordValid = false
            props.history.push(Routes.Settings)
          }}
        >
          <ActionD />
        </ActionStep>
      </ActionFlow>
    </CreateWalletDiv>
  )
}
