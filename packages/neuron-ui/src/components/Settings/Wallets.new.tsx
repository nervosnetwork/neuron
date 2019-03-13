import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { ListGroup, Form, Container } from 'react-bootstrap'
import { Routes } from '../../utils/const'
import WalletsContext from '../../contexts/Wallets'
import { Wallet } from '../../contexts/Wallet'
import { getWallets } from '../../services/UILayer'

const Wallets = () => {
  const wallets: Wallet[] = useContext(WalletsContext).items

  const [walletSelected, setWalletSelected] = useState(() => {
    getWallets()
    return 0
  })

  return (
    <>
      <ListGroup>
        {wallets.map((wallet, index) => {
          const isChecked = index === walletSelected
          return (
            <ListGroup.Item
              key={wallet.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Form.Check
                inline
                label={wallet.name}
                type="radio"
                checked={isChecked}
                disabled={isChecked}
                onChange={() => {
                  setWalletSelected(index)
                }}
              />
            </ListGroup.Item>
          )
        })}
      </ListGroup>
      <Container
        style={{
          marginTop: 30,
        }}
      >
        <Link to={`${Routes.CreateWallet}/new`} className="btn btn-primary">
          Create Wallet
        </Link>
        <Link
          to={`${Routes.ImportWallet}/new`}
          className="btn btn-primary"
          style={{
            marginLeft: 30,
          }}
        >
          Import Wallet
        </Link>
      </Container>
    </>
  )
}

export default Wallets
