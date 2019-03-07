import React, { useContext } from 'react'
import { Card, ListGroup, Alert } from 'react-bootstrap'
import WalletContext from '../../contexts/Wallet'
import { ContentProps } from '../../containers/MainContent'

const WalletDetail: React.SFC<{ children?: React.ReactNode } & Partial<ContentProps>> = () => {
  const wallet = useContext(WalletContext)

  const items = ['Simulate long content...', `balance: ${wallet.balance}`]

  return wallet.name ? (
    <Card>
      <Card.Header>{wallet.name}</Card.Header>
      <Card.Body />
      <ListGroup>
        {items.map(item => (
          <ListGroup.Item key={item}>{item}</ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  ) : (
    <Alert variant="warning">No Wallet</Alert>
  )
}

export default WalletDetail
