import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import WalletNamesContext from '../../contexts/WalletNames'
import * as UILayer from '../../services/UILayer'

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
  const walletNames = useContext(WalletNamesContext)
  const [walletSelected, setWalletSelected] = useState(0)

  useEffect(() => {
    UILayer.getWalletNameListStore()
  }, walletNames.name)

  const deleteWallet = () => {
    UILayer.deleteWalletStore(walletNames.name[walletSelected])
    setWalletSelected(0)
  }

  const addWallet = () => {
    const walletName = `wallet${Math.ceil(Math.random() * 100)}`
    UILayer.saveWalletStore(walletName, {
      name: walletName,
      keystore: '',
    })
  }

  const updateWallet = () => {
    const walletName = `wallet${Math.ceil(Math.random() * 100)}`
    UILayer.renameWalletStore(walletName, walletNames.name[walletSelected])
  }

  return (
    <ContentPanel>
      {walletNames.name.map(wallet => {
        if (walletNames.name[walletSelected] === wallet) {
          return <WalletSelectedItem key={wallet}>{wallet}</WalletSelectedItem>
        }
        return (
          <WalletItem
            key={wallet}
            onClick={() => {
              setWalletSelected(walletNames.name.indexOf(wallet))
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
            deleteWallet()
          }}
        >
          Delete
        </DeleteWallet>
      </WalletButtonPanel>
    </ContentPanel>
  )
}

export default General
