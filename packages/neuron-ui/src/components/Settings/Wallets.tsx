import React, { useMemo, useEffect, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Col, Row, ListGroup, Form, Container, Pagination } from 'react-bootstrap'
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
  const pageSize = 5
  const [totalPage, setTotalPage] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const showWallets = wallets.slice(pageSize * (pageNo - 1), pageSize * pageNo)

  useEffect(() => {
    dispatch({
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    })
    setTotalPage(Math.ceil(wallets.length / pageSize))
  }, [wallets.length])

  useEffect(() => {
    if (pageNo > totalPage) {
      setPageNo(1)
    }
  }, [totalPage])

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

  const pageItems = useMemo(() => {
    const items = []
    for (let number = 1; number <= totalPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === pageNo}
          onClick={() => {
            setPageNo(number)
          }}
        >
          {number}
        </Pagination.Item>,
      )
    }
    return items
  }, [totalPage, pageNo])

  return (
    <>
      <ContextMenuZone menuItems={menuItems}>
        <ListGroup>
          {showWallets.map(wallet => {
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
        <Pagination>{pageItems}</Pagination>
      </Container>
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
