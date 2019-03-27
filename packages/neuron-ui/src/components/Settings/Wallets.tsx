import React, { useContext } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { ListGroup, Form, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Configure } from 'grommet-icons'

import { Routes } from '../../utils/const'
import WalletContext from '../../contexts/Wallet'
import SettingsContext from '../../contexts/Settings'
import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import InputWalletPasswordDialog, { CheckType } from './InputWalletPasswordDialog'
import Dialog from '../../widgets/Dialog'
import Dropdown, { DropDownItem } from '../../widgets/Dropdown'

const Popover = styled.div`
  position: relative;
  &:hover {
    & > ul {
      display: block !important;
    }
  }
`

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
  const activeWallet = useContext(WalletContext)
  const { wallets } = useContext(SettingsContext)
  const { dispatch, dialog, history } = props
  const [t] = useTranslation()

  const actionItems = (id: string) => [
    {
      label: t('menuitem.select'),
      onClick: () => {
        dispatch(actionCreators.setActiveWallet(id))
      },
    },
    {
      label: t('menuitem.backup'),
      onClick: () => {
        dispatch(actionCreators.backupWallet(id))
      },
    },
    {
      label: t('menuitem.edit'),
      onClick: () => {
        history.push(`${Routes.WalletEditor}/${id}}`)
      },
    },
    {
      label: t('menuitem.remove'),
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
                  dispatch(actionCreators.setActiveWallet(wallet.id))
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
        <Link to={`${Routes.CreateWallet}/new`} className="btn btn-primary">
          {t('settings.walletmanger.createwallet')}
        </Link>
        <Link
          to={`${Routes.ImportWallet}/new`}
          className="btn btn-primary"
          style={{
            marginLeft: 30,
          }}
        >
          {t('settings.walletmanger.importwallet')}
        </Link>
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
