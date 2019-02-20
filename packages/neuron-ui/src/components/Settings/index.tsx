import React from 'react'
import styled from 'styled-components'
import { Tab, Tabs } from 'grommet'

const SettingsPanel = styled.div`
  width: 800px;
`

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`

const ItemPanel = styled.li`
  margin-top: 30px;
`

const Settings = () => {
  const tabs: string[] = ['General', 'Wallets', 'Network']
  const wallets: string[] = [
    'Wallet Name1',
    'Wallet Name2',
    'Wallet Name3',
    'Wallet Name4',
    'Wallet Name5',
    'Wallet Name6',
    'Wallet Name7',
    'Wallet Name8',
  ]
  const networks: string[] = ['mainnet', 'testnet']
  return (
    <SettingsPanel>
      <Tabs flex="grow" alignSelf="center">
        <Tab title={tabs[0]}>
          <ContentPanel>
            <ItemPanel>Photo Setting</ItemPanel>
            <ItemPanel>Password Setting</ItemPanel>
            <ItemPanel>Finger Setting</ItemPanel>
          </ContentPanel>
        </Tab>
        <Tab title={tabs[1]}>
          <ContentPanel>
            {wallets.map(wallet => (
              <ItemPanel>{wallet}</ItemPanel>
            ))}
          </ContentPanel>
        </Tab>
        <Tab title={tabs[2]}>
          <ContentPanel>
            {networks.map(network => (
              <ItemPanel>{network}</ItemPanel>
            ))}
          </ContentPanel>
        </Tab>
      </Tabs>
    </SettingsPanel>
  )
}

export default Settings
