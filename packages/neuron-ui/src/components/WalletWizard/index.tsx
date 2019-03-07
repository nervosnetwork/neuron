import React, { useEffect, useContext } from 'react'
import { Button } from 'react-bootstrap'
import styled from 'styled-components'
import { Launch } from 'grommet-icons'
import WalletContext from '../../contexts/Wallet'
import { Routes } from '../../utils/const'
import ImportWallet from './importWallet'
import CreateWallet from './createWallet'

const Wizard = styled.div`
  .full-screen & {
    background-color: white;
    width: 100%;
    height: 100%;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  .buttonGroup {
    button {
      cursor: pointer;
    }
  }
`

const NavButton = ({
  label,
  position,
  onSubmit,
}: {
  label: string
  position: 'left' | 'right'
  onSubmit: (e: any) => void
}) => (
  <Button
    key={label}
    style={{
      float: position,
    }}
    size="lg"
    type="button"
    onKeyPress={onSubmit}
    onClick={onSubmit}
  >
    {label}
  </Button>
)

export default (props: any) => {
  const wallet = useContext(WalletContext)
  useEffect(() => {
    const content = document.querySelector('.main-content')
    if (content && !wallet.address) {
      content.classList.add('full-screen')
      return () => {
        content.classList.remove('full-screen')
      }
    }
    return () => {}
  }, [wallet.address])
  const buttons = [
    {
      label: 'Create New Wallet',
      position: 'left' as 'left',
      onSubmit: () => props.history.push(Routes.CreateWallet),
    },
    {
      label: 'Import Wallet',
      position: 'right' as 'right',
      onSubmit: () => props.history.push(Routes.ImportWallet),
    },
  ]
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
          {buttons.map(button => (
            <NavButton {...button} key={button.label} />
          ))}
        </div>
      </div>
    </Wizard>
  )
}

export { ImportWallet, CreateWallet }
