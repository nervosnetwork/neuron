import React, { useState, useContext } from 'react'
import styled from 'styled-components'
import { Link, RouteComponentProps } from 'react-router-dom'
import { ListGroup, Form, Container } from 'react-bootstrap'
import { Configure } from 'grommet-icons'
import { useTranslation } from 'react-i18next'
import { Routes } from '../../utils/const'
import WalletContext from '../../contexts/Settings'
import { ContentProps } from '../../containers/MainContent'
import { MainActions } from '../../containers/MainContent/reducer'
import { getWallets } from '../../services/UILayer'
import InputWalletPasswordDialog from './InputWalletPswDialog'
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
  const { wallets } = useContext(WalletContext)
  const [t] = useTranslation()

  const [walletSelected, setWalletSelected] = useState(() => {
    getWallets()
    return 0
  })

  const actionItems = (index: number) => [
    {
      label: t('select'),
      onClick: () => {
        setWalletSelected(index)
      },
    },
    {
      label: t('backup'),
      onClick: () => {
        // props.history.push(`${Routes.NetworkEditor}/${network.name}`)
      },
    },
    {
      label: t('edit'),
      onClick: () => {
        props.history.push(`${Routes.WalletEditor}/${wallets[walletSelected].name}`)
      },
    },
    {
      label: t('remove'),
      onClick: () => {
        props.dispatch({
          type: MainActions.SetDialog,
          payload: <InputWalletPasswordDialog walletName={wallets[walletSelected].name} dispatch={props.dispatch} />,
        })
      },
    },
  ]

  return (
    <>
      <ListGroup>
        {wallets.map((wallet, index) => {
          const isChecked = index === walletSelected
          return (
            <ListGroup.Item
              key={wallet.name}
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
                  setWalletSelected(index)
                }}
              />
              <WalletActions isDefault={isChecked} actionItems={actionItems(index)} />
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
          {t('Create Wallet')}
        </Link>
        <Link
          to={`${Routes.ImportWallet}/new`}
          className="btn btn-primary"
          style={{
            marginLeft: 30,
          }}
        >
          {t('Import Wallet')}
        </Link>
      </Container>
    </>
  )
}

export default Wallets
