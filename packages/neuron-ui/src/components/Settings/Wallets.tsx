import React, { useMemo, useEffect } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Col, Row, ListGroup, Form, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Routes, MnemonicAction } from '../../utils/const'
import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import InputWalletPasswordDialog, { CheckType } from './InputWalletPasswordDialog'
import Dialog from '../../widgets/Dialog'
import { useNeuronWallet } from '../../utils/hooks'
import ContextMenuZone from '../../widgets/ContextMenuZone'

interface MenuItemParams {
  id: string
}

const buttons = [
  { label: 'wizard.create-new-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Create}` },
  { label: 'wizard.import-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Import}` },
]

const Wallets = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    wallet: activeWallet,
    settings: { wallets },
    messages: errorMessage,
  } = useNeuronWallet()
  const { dispatch, dialog, history } = props
  const [t] = useTranslation()

  useEffect(() => {
    dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    })
  }, [wallets.length])

  const menuItems = useMemo(
    () => [
      {
        label: t('menuitem.select'),
        click: ({ id }: MenuItemParams) => {
          dispatch(actionCreators.activateWallet(id))
        },
      },
      {
        label: t('menuitem.backup'),
        click: ({ id }: MenuItemParams) => {
          dispatch(actionCreators.backupWallet(id))
        },
      },
      {
        label: t('menuitem.edit'),
        click: ({ id }: MenuItemParams) => {
          history.push(`${Routes.WalletEditor}/${id}`)
        },
      },
      {
        label: t('menuitem.remove'),
        click: ({ id }: MenuItemParams) => {
          dispatch({
            type: MainActions.SetDialog,
            payload: {
              open: true,
              id,
            },
          })
        },
      },
    ],
    [],
  )

  return (
    <>
      <ContextMenuZone menuItems={menuItems}>
        <ListGroup>
          {wallets.map(wallet => {
            const isChecked = wallet.id === activeWallet.id
            return (
              <ListGroup.Item
                key={wallet.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
                data-menuitem={JSON.stringify({ id: wallet.id })}
              >
                <Form.Check
                  inline
                  label={wallet.name}
                  type="radio"
                  checked={isChecked}
                  disabled={isChecked}
                  onChange={() => {
                    dispatch(actionCreators.activateWallet(wallet.id))
                  }}
                />
              </ListGroup.Item>
            )
          })}
        </ListGroup>
      </ContextMenuZone>
      <Container
        style={{
          marginTop: 30,
        }}
      >
        <Row>
          {buttons.map(({ label, href }) => (
            <Col key={label}>
              <Link className="btn btn-primary" to={href}>
                {t(label)}
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
      <Dialog
        open={dialog.open}
        onClick={() => {
          dispatch({
            type: MainActions.SetDialog,
            payload: {
              open: false,
            },
          })
        }}
      >
        <InputWalletPasswordDialog
          wallet={wallets.find(wallet => wallet.id === dialog.id)}
          dispatch={dispatch}
          errorMessage={errorMessage.length > 0 ? errorMessage[errorMessage.length - 1].content : ''}
          checkType={CheckType.DeleteWallet}
        />
      </Dialog>
    </>
  )
}

export default Wallets
