import React, { useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import TransferItemList from 'components/TransferItemList'
import TransferConfirm from 'components/TransferConfirm'

import Dialog from 'widgets/Dialog'
import QRScanner from 'widgets/QRScanner'
import InlineInputWithDropdown from 'widgets/InlineInput/InlineInputWithDropdown'
import { Spinner } from 'widgets/Loading'

import { ContentProps } from 'containers/MainContent'
import { useOnDialogCancel } from 'containers/MainContent/hooks'
import { PlaceHolders } from 'utils/const'

import { useNeuronWallet } from 'utils/hooks'

import {
  useUpdateTransferItem,
  useOnSubmit,
  useOnPasswordChange,
  useOnConfirm,
  useOnItemChange,
  useDropdownItems,
  useInitialize,
  useMessageListener,
} from './hooks'

const Transfer = ({
  transfer,
  dispatch,
  password,
  dialog,
  errorMsgs,
  history,
  match: {
    params: { address },
  },
}: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ address: string }>>) => {
  const { t } = useTranslation()

  const id = useMemo(() => Math.round(Math.random() * 1000).toString(), [])

  const { messages } = useNeuronWallet()

  const [loading, setLoading] = useState(false)

  const lastMessage = messages[messages.length - 1] || { title: '', id: null }

  useMessageListener(id, lastMessage.id, lastMessage.title, setLoading)

  const updateTransferItem = useUpdateTransferItem(dispatch)

  const onSubmit = useOnSubmit(dispatch)

  const onPasswordChange = useOnPasswordChange(dispatch)

  const onConfirm = useOnConfirm(dispatch, setLoading)

  const onCancel = useOnDialogCancel(dispatch)

  const onItemChange = useOnItemChange(updateTransferItem)

  const dropdownItems = useDropdownItems(updateTransferItem)

  useInitialize(address, dispatch, history, updateTransferItem)

  return (
    <Container>
      <Card>
        <Card.Header>{t('navbar.send')}</Card.Header>
        <Card.Body>
          {errorMsgs.transfer ? <Alert variant="warning">{t(`messages.${errorMsgs.transfer}`)}</Alert> : null}
          <Form>
            {transfer.items.map((item, idx) => (
              <div key={`capacity-${idx * 1}`}>
                <Form.Group as={Row}>
                  <Form.Label column>{t('send.address')}</Form.Label>
                  <Col sm={10}>
                    <InputGroup>
                      <Form.Control
                        disabled={loading}
                        value={item.address || ''}
                        onChange={onItemChange('address', idx)}
                        placeholder={PlaceHolders.transfer.Address}
                      />
                      <InputGroup.Append>
                        <InputGroup.Text
                          style={{
                            padding: 0,
                          }}
                        >
                          <QRScanner
                            title={t('send.scan-to-get-address')}
                            label={t('send.address')}
                            onConfirm={(data: string) => updateTransferItem('address')(idx)(data)}
                          />
                        </InputGroup.Text>
                      </InputGroup.Append>
                    </InputGroup>
                  </Col>
                </Form.Group>
                <InlineInputWithDropdown
                  label={t('send.capacity')}
                  disabled={loading}
                  value={item.capacity}
                  placeholder={PlaceHolders.transfer.Capacity}
                  onChange={onItemChange('capacity', idx)}
                  dropDown={{
                    title: item.unit,
                    items: dropdownItems(idx),
                  }}
                />
              </div>
            ))}
          </Form>
          <Button type="submit" variant="primary" size="lg" block disabled={loading} onClick={onSubmit(transfer.items)}>
            {loading ? <Spinner /> : t('send.send')}
          </Button>
        </Card.Body>
      </Card>
      <Dialog open={dialog.open} onClick={onCancel}>
        <TransferConfirm
          title={t('send.confirm-password')}
          message={<TransferItemList items={transfer.items} />}
          password={password}
          onChange={onPasswordChange}
          onSubmit={onConfirm(id, transfer.items, password)}
          onCancel={onCancel}
        />
      </Dialog>
    </Container>
  )
}

export default Transfer
