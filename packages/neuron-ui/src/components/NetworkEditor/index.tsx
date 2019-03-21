import React, { useEffect, useContext } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { MainActions, actionCreators } from '../../containers/MainContent/reducer'
import { ContentProps } from '../../containers/MainContent'
import InlineInput, { InputProps } from '../../widgets/InlineInput'

import ChainContext from '../../contexts/Chain'
import SettingsContext from '../../contexts/Settings'

enum PlaceHolder {
  Name = 'My Custom Node',
  URL = 'http://localhost:8114',
}
enum TooltipText {
  Name = 'Alias for the node',
  URL = 'Address of the node',
}

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ name: string }>>) => {
  const { networkEditor, dispatch, errorMsgs, match } = props
  const settings = useContext(SettingsContext)
  const chain = useContext(ChainContext)
  const { params } = match
  const [t] = useTranslation()

  // idx of the network to update, -1 means create
  const idx = settings.networks.map(n => n.name).indexOf(params.name)

  useEffect(() => {
    if (idx > -1) {
      dispatch({
        type: MainActions.UpdateNetworkEditor,
        payload: settings.networks[idx],
      })
    }
    return () => {
      // clean props of editor
      dispatch({
        type: MainActions.UpdateNetworkEditor,
        payload: {
          name: '',
          remote: '',
        },
      })
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          networks: '',
        },
      })
    }
  }, [params.name])

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
      <Card.Header>{idx === -1 ? t('settings.network.editnetwork.title') : params.name}</Card.Header>
      {errorMsgs.networks ? <Alert variant="warning">{t(`messages.${errorMsgs.networks}`)}</Alert> : null}
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
            if (chain.network.name === params.name) {
              dispatch(actionCreators.setNetwork(networkEditor))
            }
            dispatch(actionCreators.saveNetworks(idx, settings.networks, networkEditor, props.history.push))
          }}
        >
          Save
        </Button>
      </Card.Body>
    </Card>
  )
}
