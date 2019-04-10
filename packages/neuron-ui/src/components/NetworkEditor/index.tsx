import React, { useEffect, useRef, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { MainActions, actionCreators, initState } from '../../containers/MainContent/reducer'
import { ContentProps } from '../../containers/MainContent'

import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { Routes } from '../../utils/const'
import { useNeuronWallet } from '../../utils/hooks'

export interface RawNetwork {
  name: string
  remote: string
}

enum PlaceHolder {
  Name = 'My Custom Node',
  URL = 'http://localhost:8114',
}

enum TooltipText {
  Name = 'Alias for the node',
  URL = 'Address of the node',
}

const NetworkEditor = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const {
    networkEditor,
    dispatch,
    errorMsgs,
    match: { params },
    history,
  } = props
  const [t] = useTranslation()
  const {
    settings: { networks },
  } = useNeuronWallet()
  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === params.id)

  const initiateFields = useCallback((network: RawNetwork) => {
    dispatch({
      type: MainActions.UpdateNetworkEditor,
      payload: network,
    })
    dispatch({
      type: MainActions.ErrorMessage,
      payload: {
        networks: '',
      },
    })
  }, [])

  const handleInput = useCallback(
    (fieldName: 'name' | 'remote') => (event: React.FormEvent<Pick<any, string | number | symbol>>) => {
      dispatch({
        type: MainActions.UpdateNetworkEditor,
        payload: {
          [fieldName]: event.currentTarget.value,
        },
      })
    },
    [],
  )

  const inputs: InputProps[] = [
    {
      label: t('settings.network.editnetwork.rpcurl'),
      value: networkEditor.remote,
      onChange: handleInput('remote'),
      tooltip: TooltipText.URL,
      placeholder: PlaceHolder.URL,
    },
    {
      label: t('settings.network.editnetwork.name'),
      value: networkEditor.name,
      onChange: handleInput('name'),
      tooltip: TooltipText.Name,
      placeholder: PlaceHolder.Name,
    },
  ]

  useEffect(() => {
    if (cachedNetworks.current.length !== networks.length) {
      history.push(Routes.SettingsNetworks)
    } else if (params.id !== 'new') {
      const currentNetwork = networks.find(network => network.id === params.id)
      if (!cachedNetwork || !currentNetwork) {
        dispatch({
          type: MainActions.ErrorMessage,
          payload: {
            networks: t('messages.network-is-not-found'),
          },
        })
        return
      }
      if (cachedNetwork.name !== currentNetwork.name || cachedNetwork.remote !== currentNetwork.remote) {
        history.push(Routes.SettingsNetworks)
      }
    }
  })

  useEffect(() => {
    if (params.id === 'new') {
      initiateFields(initState.networkEditor)
    } else {
      const network = networks.find(n => n.id === params.id)
      if (network) {
        initiateFields({ name: network.name, remote: network.remote })
      } else {
        dispatch({
          type: MainActions.ErrorMessage,
          payload: {
            networks: t('messages.network-is-not-found'),
          },
        })
      }
    }
  }, [params.id])

  const invalidParams = !networkEditor.name || !networkEditor.remote
  const notUpdated =
    cachedNetwork && (cachedNetwork.name === networkEditor.name && cachedNetwork.remote === networkEditor.remote)

  return (
    <Card>
      <Card.Header>{params.id === 'new' ? t('settings.network.editnetwork.title') : 'name'}</Card.Header>
      {errorMsgs.networks ? <Alert variant="warning">{errorMsgs.networks}</Alert> : null}
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={invalidParams || notUpdated}
          onClick={() => {
            dispatch(actionCreators.createOrUpdateNetwork({ id: params.id, ...networkEditor }, networks))
          }}
        >
          Save
        </Button>
        <Button type="reset" variant="primary" size="lg" block onClick={() => history.goBack()}>
          Cancel
        </Button>
      </Card.Body>
    </Card>
  )
}

NetworkEditor.displayName = 'NetworkEditor'

export default NetworkEditor
