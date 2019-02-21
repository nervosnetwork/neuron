import React, { useState } from 'react'
import styled from 'styled-components'
import { Tab, Tabs, RadioButton } from 'grommet'

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

const NetworkItem = styled.div`
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
  ]
  const networks: string[] = ['Mainnet', 'Testnet']
  const [selected, setSelected] = useState(networks[0])

  return (
    <SettingsPanel>
      <Tabs flex="grow" alignSelf="center">
        <Tab title={tabs[0]}>
          <ContentPanel>
            <ItemPanel>Photo Setting</ItemPanel>
            <ItemPanel>Password Setting</ItemPanel>
            <ItemPanel>Language Setting</ItemPanel>
            <ItemPanel>About Neuron</ItemPanel>
            <ItemPanel>Contact Us</ItemPanel>
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
              <NetworkItem>
                <RadioButton
                  name="network"
                  checked={selected === network}
                  label={network}
                  onChange={() => {
                    setSelected(network)
                  }}
                />
              </NetworkItem>
            ))}
          </ContentPanel>
        </Tab>
      </Tabs>
    </SettingsPanel>
  )
}

export default Settings
