import React, { useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, PrimaryButton, DefaultButton, TextField } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { useInitialize, useInputs, useNetworkEditor, useIsInputsValid, useHandleSubmit } from './hooks'

const NetworkEditor = ({
  settings: { networks },
  dispatch,
  match: {
    params: { id },
  },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ id: string }>>) => {
  const editor = useNetworkEditor()
  const [t] = useTranslation()
  const inputs = useInputs(editor)
  useInitialize(id, networks, editor.initialize, dispatch)

  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === id)
  const { invalidParams, notModified } = useIsInputsValid(editor, cachedNetwork)
  const handleSubmit = useHandleSubmit(id, editor.name.value, editor.remote.value, networks, dispatch)

  return (
    <Stack tokens={{ childrenGap: 15 }}>
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
