import React, { useState } from 'react'
import styled from 'styled-components'

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

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`

const WalletSelectedItem = styled(WalletItem)`
  background: #81fced;
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
  margin: 30px 0 0 50px;
`

const DeleteWallet = styled(WalletButton)`
  margin: 30px 0 0 50px;
`

const UpdateWallet = styled(WalletButton)`
  margin: 30px 0 0 50px;
`

const General = () => {
  const wallets: string[] = [
    'Wallet Name1',
    'Wallet Name2',
    'Wallet Name3',
    'Wallet Name4',
    'Wallet Name5',
    'Wallet Name6',
  ]
  const [walletSelected, setWalletSelected] = useState(wallets[0])
  const [walletsState, setWalletsState] = useState(wallets)

  const deleteWallet = (walletName: string) => {
    const temps = walletsState
    const index = temps.indexOf(walletName)
    if (index > -1) {
      temps.splice(index, 1)
    }
    setWalletSelected(temps[0])
    setWalletsState(temps)
  }

  const addWallet = () => {
    const temps = walletsState
    setWalletsState(temps.concat(`Wallet Name${temps.length + 1}`))
  }

  const updateWallet = () => {
    const temps = walletsState
    const temp = walletSelected
    const index = temps.indexOf(walletSelected)
    const name = prompt('Please enter your wallet name', temp)
    if (index > -1 && name != null && name !== '') {
      temps.splice(index, 1, name)
    }
    setWalletsState(temps)
  }

  return (
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
        <UpdateWallet
          onClick={() => {
            updateWallet()
          }}
        >
          Update
        </UpdateWallet>
        <DeleteWallet
          onClick={() => {
            deleteWallet(walletSelected)
          }}
        >
          Delete
        </DeleteWallet>
      </WalletButtonPanel>
    </ContentPanel>
  )
}

export default General
