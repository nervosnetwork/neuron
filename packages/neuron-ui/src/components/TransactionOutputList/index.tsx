import React from 'react'
import { ListGroup } from 'react-bootstrap'

import { TransactionOutput } from 'services/UILayer'
import i18n from 'utils/i18n'

const TransactionOutputList = ({ items }: { items: TransactionOutput[] }) => (
  <ListGroup variant="flush">
    {items.map(item => (
      <ListGroup.Item key={item.address}>
        {`${+item.amount} ${item.unit} ${i18n.t('send.to')} ${item.address}`}
      </ListGroup.Item>
    ))}
  </ListGroup>
)

TransactionOutputList.displayName = 'TransactionOutputList'

export default TransactionOutputList
