import React from 'react'
import styled from 'styled-components'
import { Tab, Tabs } from 'grommet'
import General from './general'
import Wallets from './wallets'
import Network from './network'

const SettingsPanel = styled.div`
  width: 800px;
`

const Settings = () => {
  const tabs: string[] = ['General', 'Wallets', 'Network']

  return (
    <SettingsPanel>
      <Tabs flex="grow" alignSelf="center">
        <Tab title={tabs[0]}>
          <General />
        </Tab>
        <Tab title={tabs[1]}>
          <Wallets />
        </Tab>
        <Tab title={tabs[2]}>
          <Network />
        </Tab>
      </Tabs>
    </SettingsPanel>
  )
}

export default Settings
