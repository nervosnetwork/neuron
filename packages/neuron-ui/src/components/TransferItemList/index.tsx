import React from 'react'
import { ListGroup } from 'react-bootstrap'

import { TransferItem } from 'services/UILayer'
import i18n from 'utils/i18n'

const TransferItemList = ({ items }: { items: TransferItem[] }) => (
  <ListGroup variant="flush">
    {items.map(item => (
      <ListGroup.Item key={item.address}>
        {`${+item.capacity} ${item.unit} ${i18n.t('send.to')} ${item.address}`}
      </ListGroup.Item>
    ))}
  </ListGroup>
)

TransferItemList.displayName = 'TransferItemList'

export default TransferItemList
