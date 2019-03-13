import React, { useState, useContext } from 'react'
import { ListGroup, Form } from 'react-bootstrap'
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
    // <text>{JSON.stringify(wallets)}</text>
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
              onClick={() => {
                setWalletSelected(index)
              }}
            />
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}

export default Wallets
