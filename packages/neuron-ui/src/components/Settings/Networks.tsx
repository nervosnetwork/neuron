import React, { useContext, useCallback } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Form, ListGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import ChainContext from '../../contexts/Chain'
import SettingsContext from '../../contexts/Settings'
import { ContentProps } from '../../containers/MainContent'
import { Routes } from '../../utils/const'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'

import Dialog from '../../widgets/Dialog'
import RemoveNetworkDialog from './RemoveNetworkDialog'

import { contextMenusCall } from '../../services/UILayer'

const Networks = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const chain = useContext(ChainContext)
  const settings = useContext(SettingsContext)
  const [t] = useTranslation()
  const { dispatch, dialog } = props

  const onContextMenu = useCallback(
    (id: string) => () => {
      contextMenusCall.networksSetting(id)
    },
    [settings.networks.length],
  )

  return (
    <>
      <ListGroup>
        {settings.networks.map(network => {
          const isChecked =
            // chain.network.remote === network.remote && // it will make things too complex
            chain.network.name === network.name
          return (
            <ListGroup.Item
              key={network.name || network.remote}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
              onContextMenu={onContextMenu(network.id!)}
            >
              <Form.Check
                inline
                label={network.name || network.remote}
                type="radio"
                checked={isChecked}
                disabled={isChecked}
                onChange={() => {
                  props.dispatch(actionCreators.setNetwork(network))
                }}
              />
            </ListGroup.Item>
          )
        })}
      </ListGroup>
      <Link to={`${Routes.NetworkEditor}/new`} className="btn btn-primary">
        {t('settings.network.addnetwork')}
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
        <RemoveNetworkDialog isChecked={dialog.isChecked as boolean} network={dialog.network} dispatch={dispatch} />
      </Dialog>
    </>
  )
}

export default Networks
