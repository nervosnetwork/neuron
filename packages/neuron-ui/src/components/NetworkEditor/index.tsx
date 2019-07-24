import React, { useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, DefaultButton, TextField } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { useGoBack } from 'utils/hooks'
import { useInitialize, useInputs, useNetworkEditor, useIsInputsValid, useHandleSubmit } from './hooks'

const NetworkEditor = ({
  settings: { networks = [] },
  match: {
    params: { id = '' },
  },
  history,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ id: string }>>) => {
  const editor = useNetworkEditor()
  const [t] = useTranslation()
  const inputs = useInputs(editor)
  const goBack = useGoBack(history)
  useInitialize(id, networks, editor.initialize, dispatch)

  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === id)
  const { invalidParams, notModified } = useIsInputsValid(editor, cachedNetwork)
  const handleSubmit = useHandleSubmit(id, editor.name.value, editor.remote.value, networks, history, dispatch)

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t('settings.network.edit-network.title')}</h1>
      <Stack tokens={{ childrenGap: 15 }}>
        {inputs.map(inputProps => (
          <Stack.Item key={inputProps.label}>
            <TextField {...inputProps} key={inputProps.label} required />
          </Stack.Item>
        ))}
      </Stack>
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 20 }}>
        <DefaultButton onClick={goBack} text={t('common.cancel')} />
        <PrimaryButton disabled={invalidParams || notModified} onClick={handleSubmit} text={t('common.save')} />
      </Stack>
    </Stack>
  )
}

NetworkEditor.displayName = 'NetworkEditor'

export default NetworkEditor
