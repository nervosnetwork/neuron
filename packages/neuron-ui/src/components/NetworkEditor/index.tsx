import React, { useEffect, useContext, useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { MainActions, actionCreators, initState } from '../../containers/MainContent/reducer'
import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'
import SettingsContext from '../../contexts/Settings'

enum PlaceHolder {
  Name = 'My Custom Node',
  URL = 'http://localhost:8114',
}
enum TooltipText {
  Name = 'Alias for the node',
  URL = 'Address of the node',
}

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const { networkEditor, dispatch, errorMsgs, match, history } = props
  const { params } = match
  const [t] = useTranslation()
  const settings = useContext(SettingsContext)

  const currentNetwork = settings.networks.find(n => n.id === params.id)

  const ref = useRef({
    count: settings.networks.length,
    detail: currentNetwork,
  })

  useEffect(() => {
    if (params.id === 'new') {
      dispatch({
        type: MainActions.UpdateNetworkEditor,
        payload: initState.networkEditor,
      })
    } else {
      const network = settings.networks.find(n => n.id === params.id)
      if (network) {
        dispatch({
          type: MainActions.UpdateNetworkEditor,
          payload: {
            name: network.name,
            remote: network.remote,
          },
        })
      } else {
        // TODO: handle error
      }
    }
    return () => {
      // TODO: clean
      dispatch({
        type: MainActions.UpdateNetworkEditor,
        payload: initState.networkEditor,
      })
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          networks: '',
        },
      })
    }
  }, [params.id])

  useEffect(() => {
    if (
      ref.current.count !== settings.networks.length ||
      JSON.stringify(ref.current.detail) !== JSON.stringify(currentNetwork)
    ) {
      history.goBack()
    }
    return () => {
      // TODO: clean
    }
  }, [settings.networks.length, JSON.stringify(currentNetwork)])

  const inputs: InputProps[] = [
    {
      label: t('settings.network.editnetwork.rpcurl'),
      value: networkEditor.remote,
      onChange: e =>
        dispatch({
          type: MainActions.UpdateNetworkEditor,
          payload: {
            remote: e.currentTarget.value,
          },
        }),
      tooltip: TooltipText.URL,
      placeholder: PlaceHolder.URL,
    },
    {
      label: t('settings.network.editnetwork.name'),
      value: networkEditor.name,
      onChange: e =>
        dispatch({
          type: MainActions.UpdateNetworkEditor,
          payload: {
            name: e.currentTarget.value,
          },
        }),
      tooltip: TooltipText.Name,
      placeholder: PlaceHolder.Name,
    },
  ]

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
          onClick={() => {
            dispatch(
              actionCreators.createOrUpdateNetowrk({
                id: params.id,
                ...networkEditor,
              }),
            )
          }}
        >
          Save
        </Button>
      </Card.Body>
    </Card>
  )
}
