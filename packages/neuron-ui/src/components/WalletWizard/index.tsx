import React, { useEffect, useContext } from 'react'
import styled from 'styled-components'
import { Launch } from 'grommet-icons'
import WalletContext from '../../contexts/wallet'
import { Routes } from '../../utils/const'
import ImportWallet from './importWallet'
import CreateWallet from './createWallet'
import Typography from '../../widgets/Typegraphy'

const Wizard = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 80px;
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
    if (content) {
      content.classList.add('full-screen')
      return () => {
        content.classList.remove('full-screen')
      }
    }
    return () => {}
  }, [wallet && wallet.name])
  return (
    <Wizard>
      <div style={{ textAlign: 'center' }}>
        <Launch size="large" />
        <Typography variant="h1">Create or import your first wallet</Typography>
        <div className="buttonGroup">
          <button
            style={{ float: 'left' }}
            type="button"
            onKeyPress={() => {
              //   for users with physical disabilities who cannot use a mouse
            }}
            onClick={() => {
              props.history.push(Routes.CreateWallet)
            }}
          >
            <Typography> Create New Wallet </Typography>
          </button>
          <button
            style={{ float: 'right' }}
            type="button"
            onKeyPress={() => {
              //   for users with physical disabilities who cannot use a mouse
            }}
            onClick={() => {
              props.history.push(Routes.ImportWallet)
            }}
          >
            <Typography> Import Wallet </Typography>
          </button>
        </div>
      </div>
    </Wizard>
  )
}

export { ImportWallet, CreateWallet }
