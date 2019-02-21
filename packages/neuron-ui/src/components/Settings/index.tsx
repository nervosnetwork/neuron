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
const WalletItem = styled.div`
  margin-top: 15px;
  width: 500px;
  height: 60px;
  border-radius: 10px;
  text-align: center;
  line-height: 60px;
  background: #ffffff;
  box-shadow: 1px 1px 3px #999999;
`

const WalletSelectedItem = styled(WalletItem)`
  background: #81fced;
`

const NetworkItem = styled.div`
  margin-top: 30px;
`

const WalletButtonPanel = styled.div`
  display: flex;
  flex-direction: row;
`

const WalletButton = styled.div`
  width: 80px;
  height: 40px;
  align-items: left;
  background: blue;
  color: white;
  text-align: center;
  line-height: 40px;
  border-radius: 5px;
`

const AddWallet = styled(WalletButton)`
  margin: 30px 0 0 30px;
`

const DeleteWallet = styled(WalletButton)`
  margin: 30px 0 0 30px;
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
  const [networkSelected, setNetworkSelected] = useState(networks[0])
  const [walletSelected, setWalletSelected] = useState(wallets[0])
  const [walletsState, setWalletsState] = useState(wallets)

  const deleteWallet = (walletName: string) => {
    const index = wallets.indexOf(walletName)
    if (index > -1) {
      wallets.splice(index, 1)
    }
    setWalletSelected(wallets[0])
    setWalletsState(wallets)
  }

  const addWallet = () => {
    wallets.push(`Wallet Name${wallets.length + 1}`)
    setWalletSelected(wallets[0])
    setWalletsState(wallets)
  }

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
            {walletsState.map((wallet: string) => {
              if (walletSelected === wallet) {
                return <WalletSelectedItem>{wallet}</WalletSelectedItem>
              }
              return (
                <WalletItem
                  onClick={() => {
                    setWalletSelected(wallet)
                  }}
                >
                  {wallet}
                </WalletItem>
              )
            })}
            <WalletButtonPanel>
              <AddWallet
                onClick={() => {
                  addWallet()
                }}
              >
                Add
              </AddWallet>
              <DeleteWallet
                onClick={() => {
                  deleteWallet(walletSelected)
                }}
              >
                Delete
              </DeleteWallet>
            </WalletButtonPanel>
          </ContentPanel>
        </Tab>
        <Tab title={tabs[2]}>
          <ContentPanel>
            {networks.map(network => (
              <NetworkItem>
                <RadioButton
                  name="network"
                  checked={networkSelected === network}
                  label={network}
                  onChange={() => {
                    setNetworkSelected(network)
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
