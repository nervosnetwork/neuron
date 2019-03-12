import React, { useContext } from 'react'
import styled from 'styled-components'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Form, ListGroup } from 'react-bootstrap'
import { Configure } from 'grommet-icons'

import ChainContext, { Network } from '../../contexts/Chain'
import SettingsContext, { defaultNetworks } from '../../contexts/Settings'
import { ContentProps } from '../../containers/MainContent'
import { Routes } from '../../utils/const'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'

import RemoveNetworkDialog from './RemoveNetworkDialog'
import Dropdown, { DropDownItem } from '../../widgets/Dropdown'

const Testnet = defaultNetworks[0].name

const Popover = styled.div`
  position: relative;
  &:hover {
    & > ul {
      display: block !important;
    }
  }
`

const NetworkActions = ({ isDefault, actionItems }: { isDefault: boolean; actionItems: DropDownItem[] }) => {
  if (isDefault) {
    return null
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

const Networks = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const chain = useContext(ChainContext)
  const settings = useContext(SettingsContext)

  const actionItems = (network: Network, isDefault: boolean, isChecked: boolean) => [
    {
      label: 'Select',
      onClick: () => {
        props.dispatch(actionCreators.setNetwork(network))
      },
      disabled: isChecked || isDefault,
    },
    {
      label: 'Edit',
      onClick: () => {
        props.history.push(`${Routes.NetworkEditor}/${network.name}`)
      },
      disabled: isDefault,
    },
    {
      label: 'Remove',
      onClick: () => {
        props.dispatch({
          type: MainActions.SetDialog,
          payload: <RemoveNetworkDialog isChecked={isChecked} network={network} dispatch={props.dispatch} />,
        })
      },
      disabled: isDefault,
    },
  ]

  return (
    <>
      <ListGroup>
        {settings.networks.map(network => {
          const isChecked =
            // chain.network.remote === network.remote && // it will make things too complex
            chain.network.name === network.name
          const isDefault = network.name === Testnet
          return (
            <ListGroup.Item
              key={network.name || network.remote}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
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
              <NetworkActions isDefault={isDefault} actionItems={actionItems(network, isDefault, isChecked)} />
            </ListGroup.Item>
          )
        })}
      </ListGroup>
      <Link to={`${Routes.NetworkEditor}/new`} className="btn btn-primary">
        Add Network
      </Link>
    </>
  )
}

export default Networks
