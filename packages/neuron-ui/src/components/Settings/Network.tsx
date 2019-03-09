import React, { useContext } from 'react'
import styled from 'styled-components'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Card, Form, ListGroup, Button } from 'react-bootstrap'
import { Configure } from 'grommet-icons'

import ChainContext from '../../contexts/Chain'
import SettingsContext from '../../contexts/Settings'
import { ContentProps } from '../../containers/MainContent'
import { Routes } from '../../utils/const'
import { MainActions } from '../../containers/MainContent/reducer'

import Dropdown, { DropDownItem } from '../../widgets/Dropdown'

const Popover = styled.div`
  position: relative;
  &:hover {
    & > div {
      display: block !important;
    }
  }
`

const NetworkActions = ({
  isDefault,
  isChecked,
  actionItems,
}: {
  isDefault: boolean
  isChecked: boolean
  actionItems: DropDownItem[]
}) => {
  if (isDefault || isChecked) {
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

const Network = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const chain = useContext(ChainContext)
  const settings = useContext(SettingsContext)

  return (
    <>
      <ListGroup>
        {settings.networks.map((network, idx) => {
          const checked = chain.network.remote === network.remote && chain.network.name === network.name
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
                checked={checked}
                disabled={checked}
                onChange={() => {
                  props.dispatch(props.actionCreators.setNetowrk(network))
                }}
              />
              <NetworkActions
                isDefault={network.name === 'Testnet'}
                isChecked={checked}
                actionItems={[
                  {
                    label: 'Select',
                    onClick: () => {
                      props.dispatch(props.actionCreators.setNetowrk(network))
                    },
                  },
                  {
                    label: 'Edit',
                    onClick: () => {
                      props.history.push(`${Routes.NetworkEditor}/${network.name}`)
                    },
                  },
                  {
                    label: 'Remove',
                    onClick: () => {
                      props.dispatch({
                        type: MainActions.SetDialog,
                        payload: (
                          <Card
                            onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <Card.Header>
                              Remove Address:
                              {network.name || network.remote}
                            </Card.Header>
                            <Card.Body>hello</Card.Body>
                            <Card.Footer className="text-muted">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Button
                                  variant="danger"
                                  onClick={() => props.dispatch(props.actionCreators.deleteNetwork(idx))}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="light"
                                  onClick={() =>
                                    props.dispatch({
                                      type: MainActions.SetDialog,
                                      payload: null,
                                    })
                                  }
                                >
                                  Cancel
                                </Button>
                              </div>
                            </Card.Footer>
                          </Card>
                        ),
                      })
                    },
                  },
                ]}
              />
            </ListGroup.Item>
          )
        })}
      </ListGroup>
      <Link to={`${Routes.NetworkEditor}/new`}>Add Network</Link>
    </>
  )
}

export default Network
