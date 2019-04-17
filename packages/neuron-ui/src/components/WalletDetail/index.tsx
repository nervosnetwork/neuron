import React from 'react'
import { Card, ListGroup, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import { useNeuronWallet } from '../../utils/hooks'

const WalletDetail: React.SFC<{ children?: React.ReactNode } & Partial<ContentProps>> = () => {
  const { wallet } = useNeuronWallet()
  const [t] = useTranslation()

  const items = [`${t('settings.wallet-manager.walletdetail.balance')}: ${wallet.balance}`]

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
    <Alert variant="warning">{t('messages.no-wallet')}</Alert>
  )
}

export default WalletDetail
