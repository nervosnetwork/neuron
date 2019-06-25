import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import TransactionFeePanel from 'components/TransactionFeePanel'
import QRScanner from 'widgets/QRScanner'
import InlineInputWithDropdown from 'widgets/InlineInput/InlineInputWithDropdown'
import { Spinner } from 'widgets/Loading'

import { ContentProps } from 'containers/MainContent'
import { PlaceHolders } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

import { useInitialize } from './hooks'

const Send = ({
  send,
  dispatch,
  errorMsgs,
  history,
  match: {
    params: { address },
  },
}: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ address: string }>>) => {
  const { t } = useTranslation()
  const {
    wallet: { sending },
  } = useNeuronWallet()
  const {
    id,
    updateTransactionOutput,
    onItemChange,
    onSubmit,
    dropdownItems,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
  } = useInitialize(address, dispatch, history)

  return (
    <Container>
      <Card>
        <Card.Header>{t('navbar.send')}</Card.Header>
        <Card.Body>
          {errorMsgs.send ? <Alert variant="warning">{t(`messages.${errorMsgs.send}`)}</Alert> : null}
          <Form>
            {send.outputs.map((item, idx) => (
              <div key={`amount-${idx * 1}`}>
                <Form.Group as={Row}>
                  <Form.Label column>{t('send.address')}</Form.Label>
                  <Col sm={10}>
                    <InputGroup>
                      <Form.Control
                        disabled={sending}
                        value={item.address || ''}
                        onChange={onItemChange('address', idx)}
                        placeholder={PlaceHolders.send.Address}
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
                            onConfirm={(data: string) => updateTransactionOutput('address')(idx)(data)}
                          />
                        </InputGroup.Text>
                      </InputGroup.Append>
                    </InputGroup>
                  </Col>
                </Form.Group>
                <InlineInputWithDropdown
                  label={t('send.amount')}
                  value={item.amount}
                  placeholder={PlaceHolders.send.Amount}
                  onChange={onItemChange('amount', idx)}
                  disabled={sending}
                  dropDown={{
                    title: item.unit,
                    items: dropdownItems(idx),
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {send.outputs.length > 1 ? (
                    <button type="button" onClick={() => removeTransactionOutput(idx)}>
                      Remove this
                    </button>
                  ) : null}
                  {idx === send.outputs.length - 1 ? (
                    <button type="button" onClick={() => addTransactionOutput()}>
                      Add one
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            <input
              placeholder={t('send.description')}
              type="text"
              id="description"
              alt="description"
              value={send.description}
              onChange={onDescriptionChange}
              style={{ width: '100%' }}
            />
          </Form>
          <TransactionFeePanel fee="10" cycles="10" price={send.price} onPriceChange={updateTransactionPrice} />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            onClick={onSubmit(id, send.outputs, send.description)}
            disabled={sending}
          >
            {sending ? <Spinner /> : t('send.send')}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  )
}

Send.displayName = 'Send'

export default Send
