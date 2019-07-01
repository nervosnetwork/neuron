import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Form, ListGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

import { appCalls } from 'services/UILayer'
import { Routes } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

import ListGroupWithMaxHeight from 'widgets/ListGroupWithMaxHeight'

const CheckBox = styled(Form.Check)`
  pointer-events: none;
  input {
    pointer-events: auto;
  }
`

const Networks = ({ dispatch }: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain,
    settings: { networks },
  } = useNeuronWallet()
  const [t] = useTranslation()

  return (
    <>
      <ListGroupWithMaxHeight>
        {networks.map(network => {
          const isChecked = chain.networkId === network.id
          return (
            <ListGroup.Item
              key={network.id}
              onContextMenu={() => appCalls.contextMenu({ type: 'networkList', id: network.id })}
            >
              <CheckBox
                inline
                label={network.name || network.remote}
                type="radio"
                checked={isChecked}
                disabled={isChecked}
                onChange={() => {
                  dispatch(actionCreators.setNetwork(network.id!))
                }}
              />
            </ListGroup.Item>
          )
        })}
      </ListGroupWithMaxHeight>
      <Link to={`${Routes.NetworkEditor}/new`} className="btn btn-primary">
        {t('settings.network.add-network')}
      </Link>
    </>
  )
}

export default Networks
