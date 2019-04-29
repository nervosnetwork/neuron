import React, { useMemo } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Form, ListGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'
import { MainActions, actionCreators } from 'containers/MainContent/reducer'

import { Routes } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

import Dialog from 'widgets/Dialog'
import ListGroupWithMaxHeight from 'widgets/ListGroupWithMaxHeight'
import ContextMenuZone from 'widgets/ContextMenuZone'
import RemoveNetworkDialog from './RemoveNetworkDialog'

interface MenuItemParams {
  id: string
}

const Networks = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain,
    settings: { networks },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const { dispatch, dialog, history } = props

  const menuItems = useMemo(
    () => [
      {
        label: t('menuitem.select'),
        isDisabled: ({ id }: MenuItemParams) => {
          return id === chain.network.id
        },
        click: ({ id }: MenuItemParams) => {
          dispatch(actionCreators.setNetwork(id))
        },
      },
      {
        label: t('menuitem.edit'),
        isDisabled: ({ id }: MenuItemParams) => {
          return networks[0] && networks[0].id === id
        },
        click: ({ id }: MenuItemParams) => {
          history.push(`${Routes.NetworkEditor}/${id}`)
        },
      },
      {
        label: t('menuitem.delete'),
        isDisabled: ({ id }: MenuItemParams) => {
          return networks[0] && networks[0].id === id
        },
        click: ({ id }: MenuItemParams) => {
          props.dispatch({
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
        <ListGroupWithMaxHeight>
          {networks.map(network => {
            const isChecked = chain.network.id === network.id
            return (
              <ListGroup.Item key={network.id} data-menuitem={JSON.stringify({ id: network.id })}>
                <Form.Check
                  inline
                  label={network.name || network.remote}
                  type="radio"
                  checked={isChecked}
                  disabled={isChecked}
                  onChange={() => {
                    props.dispatch(actionCreators.setNetwork(network.id!))
                  }}
                />
              </ListGroup.Item>
            )
          })}
        </ListGroupWithMaxHeight>
      </ContextMenuZone>
      <Link to={`${Routes.NetworkEditor}/new`} className="btn btn-primary">
        {t('settings.network.add-network')}
      </Link>
      <Dialog
        open={dialog.open}
        onClick={() =>
          dispatch({
            type: MainActions.SetDialog,
            payload: {
              open: false,
            },
          })
        }
      >
        <RemoveNetworkDialog
          isChecked={dialog.id === chain.network.id}
          network={networks.find(n => n.id === dialog.id)}
          dispatch={dispatch}
        />
      </Dialog>
    </>
  )
}

export default Networks
