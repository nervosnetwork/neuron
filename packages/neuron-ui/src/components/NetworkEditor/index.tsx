import React, { useMemo, useRef } from 'react'
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
  const cachedNetworks = useRef(networks)
  const cachedNetwork = cachedNetworks.current.find(network => network.id === id)
  const usedNetworkNames = useMemo(
    () => networks.map(n => n.name).filter(name => name !== ((cachedNetwork && cachedNetwork.name) || '')),
    [networks, cachedNetwork]
  )
  const inputs = useInputs(editor, usedNetworkNames, t)
  const goBack = useGoBack(history)
  useInitialize(id, networks, editor.initialize, dispatch)

  const { errors, setErrors, notModified } = useIsInputsValid(editor, cachedNetwork)
  const handleSubmit = useHandleSubmit(id, editor.name.value, editor.remote.value, networks, history, dispatch)

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t('settings.network.edit-network.title')}</h1>
      <Stack tokens={{ childrenGap: 15 }}>
        {inputs.map((inputProps, idx) => (
          <Stack.Item key={inputProps.label}>
            <TextField
              {...inputProps}
              key={inputProps.label}
              required
              validateOnLoad={false}
              onNotifyValidationResult={(msg: any) => {
                const errs = [...errors]
                errs.splice(idx, 1, msg !== '')
                setErrors(errs)
              }}
            />
          </Stack.Item>
        ))}
      </Stack>
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 20 }}>
        <DefaultButton onClick={goBack} text={t('common.cancel')} />
        <PrimaryButton disabled={errors.includes(true) || notModified} onClick={handleSubmit} text={t('common.save')} />
      </Stack>
    </Stack>
  )
}

NetworkEditor.displayName = 'NetworkEditor'

export default NetworkEditor
