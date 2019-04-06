import React, { useCallback, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import TransferConfirm from '../TransferConfirm'
import TransferItemList from '../TransferItemList'

import Dialog from '../../widgets/Dialog'
import QRScanner from '../../widgets/QRScanner'
import InlineInputWithDropdown from '../../widgets/InlineInput/InlineInputWithDropdown'
import { Spinner } from '../../widgets/Loading'

import { ContentProps } from '../../containers/MainContent'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'
import initState from '../../containers/MainContent/state'
import UILayer, { TransferItem } from '../../services/UILayer'
import { CapacityUnit, PlaceHolders, Channel, Routes } from '../../utils/const'

const Transfer = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const { t } = useTranslation()
  const { transfer, dispatch, password, dialog, errorMsgs, history } = props

  useEffect(() => {
    UILayer.on(Channel.SendCapacity, (_e: Event, args: ChannelResponse<string>) => {
      if (args.status) {
        history.push(`${Routes.Transaction}/${args.result}`)
      } else {
        dispatch({
          type: MainActions.UpdateTransfer,
          payload: {
            submitting: false,
          },
        })
        dispatch({
          type: MainActions.ErrorMessage,
          payload: { transfer: args.msg },
        })
      }
    })
    return () => {
      UILayer.removeAllListeners(Channel.SendCapacity)
      dispatch({
        type: MainActions.UpdateTransfer,
        payload: initState.transfer,
      })
    }
  }, [])

  const updateTransferItem = (field: string) => (idx: number) => (value: string) => {
    dispatch({
      type: MainActions.UpdateItemInTransfer,
      payload: {
        idx,
        item: {
          [field]: value,
        },
      },
    })
  }

  const onSubmit = useCallback(
    (items: TransferItem[]) => () => {
      dispatch(actionCreators.submitTransfer(items))
    },
    [],
  )

  const onPswChange = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    dispatch({
      type: MainActions.UpdatePassword,
      payload: e.currentTarget.value,
    })
  }, [])

  const onConfirm = useCallback(
    (items: TransferItem[], pwd: string) => () => {
      props.dispatch({
        type: MainActions.SetDialog,
        payload: {
          open: false,
        },
      })
      props.dispatch({
        type: MainActions.UpdatePassword,
        payload: '',
      })
      setTimeout(() => {
        props.dispatch(
          actionCreators.confirmTransfer({
            items,
            password: pwd,
          }),
        )
      }, 10)
    },
    [],
  )

  const onCancel = useCallback(() => {
    props.dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    })
  }, [])

  const onItemChange = (field: string, idx: number) => (e: React.FormEvent<{ value: string }>) => {
    updateTransferItem(field)(idx)(e.currentTarget.value)
  }

  const dropdownItems = useCallback(
    (idx: number) =>
      Object.values(CapacityUnit)
        .filter(unit => typeof unit === 'string')
        .map((unit: string) => ({
          label: unit.toUpperCase(),
          key: unit,
          onClick: () => updateTransferItem('unit')(idx)(unit),
        })),
    [],
  )

  const disabled = transfer.submitting && !errorMsgs.transfer

  return (
    <Container>
      <Card>
        <Card.Header>{t('siderbar.send')}</Card.Header>
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
                        disabled={disabled}
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
                  disabled={disabled}
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            disabled={disabled}
            onClick={onSubmit(transfer.items)}
          >
            {disabled ? <Spinner /> : t('send.send')}
          </Button>
        </Card.Body>
      </Card>
      <Dialog open={dialog.open} onClick={onCancel}>
        <TransferConfirm
          title={t('send.confirmpassword')}
          message={<TransferItemList items={transfer.items} />}
          password={password}
          onChange={onPswChange}
          onSubmit={onConfirm(transfer.items, password)}
          onCancel={onCancel}
        />
      </Dialog>
    </Container>
  )
}

export default Transfer
