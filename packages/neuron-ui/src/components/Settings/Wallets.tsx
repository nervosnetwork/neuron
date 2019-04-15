import React, { useEffect } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Col, Row, ListGroup, Form, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Configure } from 'grommet-icons'

import { Routes, MnemonicAction } from '../../utils/const'
import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import InputWalletPasswordDialog, { CheckType } from './InputWalletPasswordDialog'
import Dialog from '../../widgets/Dialog'
import Dropdown, { DropDownItem } from '../../widgets/Dropdown'
import { useNeuronWallet } from '../../utils/hooks'

const Popover = styled.div`
  position: relative;
  &:hover {
    & > ul {
      display: block !important;
    }
  }
`

const buttons = [
  { label: 'wizard.create-new-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Create}` },
  { label: 'wizard.import-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Import}` },
]

const WalletActions = ({ isDefault, actionItems }: { isDefault: boolean; actionItems: DropDownItem[] }) => {
  if (isDefault) {
    actionItems.splice(0, 1)
  }
  return (
    <Popover>
      <Configure />
      <Dropdown
        items={actionItems}
        style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          zIndex: '999',
          display: 'none',
        }}
      />
    </Popover>
  )
}

const Wallets = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    wallet: activeWallet,
    settings: { wallets },
  } = useNeuronWallet()
  const { dispatch, dialog, history } = props
  const [t] = useTranslation()

  useEffect(() => {
    dispatch(actionCreators.getAll())
    dispatch(actionCreators.getActiveWallet())
  }, [])

  const actionItems = (id: string) => [
    {
      label: t('menuitem.select'),
      key: 'select',
      onClick: () => {
        dispatch(actionCreators.activateWallet(id))
      },
    },
    {
      label: t('menuitem.backup'),
      key: 'backup',
      onClick: () => {
        dispatch(actionCreators.backupWallet(id))
      },
    },
    {
      label: t('menuitem.edit'),
      key: 'edit',
      onClick: () => {
        history.push(`${Routes.WalletEditor}/${id}}`)
      },
    },
    {
      label: t('menuitem.remove'),
      key: 'remove',
      onClick: () => {
        dispatch({
          type: MainActions.SetDialog,
          payload: {
            open: true,
            wallet: wallets.find(wallet => wallet.id === id),
          },
        })
      },
    },
  ]

  return (
    <>
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
            >
              <Form.Check
                inline
                label={wallet.name}
                type="radio"
                checked={isChecked}
                disabled={isChecked}
                onChange={() => {
                  // setWalletSelected(index)
                  dispatch(actionCreators.activateWallet(wallet.id))
                }}
              />
              <WalletActions isDefault={isChecked} actionItems={actionItems(wallet.id)} />
            </ListGroup.Item>
          )
        })}
      </ListGroup>
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
        <InputWalletPasswordDialog wallet={dialog.wallet} dispatch={dispatch} checkType={CheckType.DeleteWallet} />
      </Dialog>
    </>
  )
}

export default Wallets
