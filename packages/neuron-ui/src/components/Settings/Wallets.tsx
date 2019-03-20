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
import { getWallets, deleteWallet } from '../../services/UILayer'
import InputWalletPasswordDialog from './InputWalletPasswordDialog'
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
      label: t('menuitem.select'),
      onClick: () => {
        setWalletSelected(index)
      },
    },
    {
      label: t('menuitem.backup'),
      onClick: () => {
        // props.history.push(`${Routes.NetworkEditor}/${network.name}`)
      },
    },
    {
      label: t('menuitem.edit'),
      onClick: () => {
        props.history.push(`${Routes.WalletEditor}/${JSON.stringify(wallets[index])}`)
      },
    },
    {
      label: t('menuitem.remove'),
      onClick: () => {
        props.dispatch({
          type: MainActions.SetDialog,
          payload: (
            <InputWalletPasswordDialog
              wallet={wallets[walletSelected]}
              dispatch={props.dispatch}
              handle={(walletID: string, password: string) => deleteWallet(walletID, password)}
            />
          ),
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
    </>
  )
}

export default Wallets
