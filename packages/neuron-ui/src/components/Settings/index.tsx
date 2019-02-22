import React from 'react'
import styled from 'styled-components'
import { Routes } from '../../utils/const'

const SettingsPanel = styled.div`
  width: 800px;
`

const TabBar = styled.div`
  display: flex;
  flex-direction: row;
`

const TabItem = styled.button`
  width: 200px;
`

const Settings = (props: any) => {
  return (
    <SettingsPanel>
      <TabBar>
        <TabItem
          onClick={() => {
            props.history.push(Routes.SettingsGeneral)
          }}
        >
          General
        </TabItem>
        <TabItem
          onClick={() => {
            props.history.push(Routes.SettingsWallets)
          }}
        >
          Wallets
        </TabItem>
        <TabItem
          onClick={() => {
            props.history.push(Routes.SettingsNetwork)
          }}
        >
          Network
        </TabItem>
      </TabBar>
    </SettingsPanel>
  )
}

export default Settings
