import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Col, Card, Button, Row, ListGroup, Form, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Routes, MnemonicAction } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'
import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

import Dialog from 'widgets/Dialog'
import ListGroupWithMaxHeight from 'widgets/ListGroupWithMaxHeight'
import ContextMenuZone from 'widgets/ContextMenuZone'

import { useToggleDialog, useDeleteWallet, useMenuItems, useWalletToDelete, useHandleConfirm } from './hooks'

const buttons = [
  { label: 'wizard.create-new-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Create}` },
  { label: 'wizard.import-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Import}` },
]

const Wallets = ({ dispatch, dialog, history }: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    wallet: { id: activeId },
    settings: { wallets },
  } = useNeuronWallet()

  const deleteWallet = useDeleteWallet()
  const [t] = useTranslation()
  const toggleDialog = useToggleDialog(dispatch)
  const menuItems = useMenuItems(deleteWallet, history, toggleDialog, dispatch)
  const handleConfirm = useHandleConfirm(deleteWallet, toggleDialog, dispatch)
  const walletToDelete = useWalletToDelete(deleteWallet.id.value, wallets)

  return (
    <>
      <ContextMenuZone menuItems={menuItems}>
        <ListGroupWithMaxHeight>
          {wallets.map(wallet => {
            const isChecked = wallet.id === activeId
            return (
              <ListGroup.Item key={wallet.id} data-menuitem={JSON.stringify({ id: wallet.id })}>
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
        </ListGroupWithMaxHeight>
      </ContextMenuZone>
      <Container>
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
      <Dialog open={dialog.open} onClick={() => toggleDialog(false)}>
        <Card
          onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {walletToDelete ? (
            <Card.Header>{t('settings.wallet-manager.delete-wallet-title', { name: walletToDelete.name })}</Card.Header>
          ) : (
            <Card.Header>Not found</Card.Header>
          )}
          {walletToDelete ? (
            <Card.Body>
              <Form.Group as={Row} controlId="formPlaintextPassword">
                <Col>
                  <Form.Control
                    type="password"
                    placeholder={`${t('settings.wallet-manager.password')}`}
                    onChange={deleteWallet.password.onChange}
                  />
                </Col>
              </Form.Group>
            </Card.Body>
          ) : null}
          <Card.Footer className="text-muted">
            <Button variant="danger" onClick={handleConfirm} disabled={deleteWallet.password.value === ''}>
              {t('common.confirm')}
            </Button>
            <Button variant="light" onClick={() => toggleDialog(false)}>
              {t('common.cancel')}
            </Button>
          </Card.Footer>
        </Card>
      </Dialog>
    </>
  )
}

export default Wallets
