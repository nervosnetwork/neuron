import React, { useEffect, useContext } from 'react'
import styled from 'styled-components'
import { Launch } from 'grommet-icons'
import WalletContext from '../../contexts/Wallet'
import { Routes } from '../../utils/const'
import ImportWallet from './importWallet'
import CreateWallet from './createWallet'

const Wizard = styled.div`
  .full-screen & {
    background-color: white;
    width: 100vw;
    height: 100vh;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  .buttonGroup {
    button {
      height: 40px;
      width: 140px;
      cursor: pointer;
    }
  }
`

export default (props: any) => {
  const wallet = useContext(WalletContext)
  useEffect(() => {
    const content = document.querySelector('.main-content')
    if (content && !wallet) {
      content.classList.add('full-screen')
      return () => {
        content.classList.remove('full-screen')
      }
    }
    return () => {}
  }, [wallet && wallet.name])
  return (
    <Wizard>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <h1>
          <Launch size="large" />
        </h1>
        <h1>Create or import your first wallet</h1>
        <div className="buttonGroup">
          <button
            style={{
              float: 'left',
            }}
            type="button"
            onKeyPress={() => {
              //   for users with physical disabilities who cannot use a mouse
            }}
            onClick={() => {
              props.history.push(Routes.CreateWallet)
            }}
          >
            Create New Wallet
          </button>
          <button
            style={{
              float: 'right',
            }}
            type="button"
            onKeyPress={() => {
              //   for users with physical disabilities who cannot use a mouse
            }}
            onClick={() => {
              props.history.push(Routes.ImportWallet)
            }}
          >
            Import Wallet
          </button>
        </div>
      </div>
    </Wizard>
  )
}

export { ImportWallet, CreateWallet }
