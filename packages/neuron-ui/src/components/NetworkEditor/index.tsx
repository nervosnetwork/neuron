import React, { useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'

import InlineInput, { InputProps } from '../../widgets/InlineInput'
import { useNeuronWallet } from '../../utils/hooks'
import { useInitiate, useInputs, useNetworkEditor, useIsInputsValid, useHandleSubmit } from './hooks'

export interface RawNetwork {
  name: string
  remote: string
}

const NetworkEditor = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const {
    dispatch,
    errorMsgs,
    match: {
      params: { id },
    },
    history,
  } = props
  const editor = useNetworkEditor()
  const {
    settings: { networks },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const inputs: InputProps[] = useInputs(editor)
  useInitiate(id, networks, editor, dispatch)

  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === id)
  const { invalidParams, notModified } = useIsInputsValid(editor, cachedNetwork)
  const handleSubmit = useHandleSubmit(id, editor.name.value, editor.remote.value, networks, dispatch)

  return (
    <Card>
      <Card.Header>{id === 'new' ? t('settings.network.edit-network.title') : 'name'}</Card.Header>
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
          disabled={invalidParams || notModified}
          onClick={handleSubmit}
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
