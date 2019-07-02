import React, { useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, PrimaryButton, DefaultButton, MessageBar, MessageBarType, TextField } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'

import { useNeuronWallet } from 'utils/hooks'
import { useInitialize, useInputs, useNetworkEditor, useIsInputsValid, useHandleSubmit } from './hooks'

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
  const inputs = useInputs(editor)
  useInitialize(id, networks, editor.initialize, dispatch)

  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === id)
  const { invalidParams, notModified } = useIsInputsValid(editor, cachedNetwork)
  const handleSubmit = useHandleSubmit(id, editor.name.value, editor.remote.value, networks, dispatch)

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      {errorMsgs.networks ? (
        <MessageBar messageBarType={MessageBarType.warning}>{errorMsgs.networks}</MessageBar>
      ) : null}
      <Stack tokens={{ childrenGap: 15 }}>
        {inputs.map(inputProps => (
          <Stack.Item>
            <TextField {...inputProps} key={inputProps.label} underlined required />
          </Stack.Item>
        ))}
      </Stack>
      <Stack horizontal horizontalAlign="space-between">
        <PrimaryButton disabled={invalidParams || notModified} onClick={handleSubmit} text={t('common.save')} />
        <DefaultButton onClick={() => history.goBack()} text={t('common.cancel')} />
      </Stack>
    </Stack>
  )
}

NetworkEditor.displayName = 'NetworkEditor'

export default NetworkEditor
