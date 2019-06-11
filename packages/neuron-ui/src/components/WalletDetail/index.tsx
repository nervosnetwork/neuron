import React from 'react'
import { Card, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'
import { useNeuronWallet } from 'utils/hooks'
import { currencyFormatter } from 'utils/formatters'

const WalletDetail: React.SFC<{ children?: React.ReactNode } & Partial<ContentProps>> = () => {
  const { wallet } = useNeuronWallet()
  const [t] = useTranslation()

  return wallet.name ? (
    <Card>
      <Card.Header>{wallet.name}</Card.Header>
      <Card.Body>
        {`Balance: ${currencyFormatter(wallet.balance)}(${currencyFormatter(wallet.balance, 'CNY')})`}
      </Card.Body>
    </Card>
  ) : (
    <Alert variant="warning">{t('messages.no-wallet')}</Alert>
  )
}

export default WalletDetail
