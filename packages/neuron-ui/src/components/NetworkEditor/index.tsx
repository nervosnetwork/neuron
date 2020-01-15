import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack } from 'office-ui-fabric-react'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'

import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { verifyNetworkName, verifyURL } from 'utils/validators'
import { useGoBack } from 'utils/hooks'
import { MAX_NETWORK_NAME_LENGTH } from 'utils/const'
import { useHandleSubmit } from './hooks'
import styles from './networkEditor.module.scss'

const NetworkEditor = () => {
  const {
    app: {
      loadings: { network: isUpdating = false },
    },
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const { id } = useParams()
  const history = useHistory()
  const cachedNetworks = useRef(networks)
  const cachedNetwork = useMemo(() => cachedNetworks.current.find(network => network.id === id), [cachedNetworks, id])
  const usedNetworkNames = useMemo(
    () => networks.map(n => n.name).filter(name => name !== ((cachedNetwork && cachedNetwork.name) || '')),
    [networks, cachedNetwork]
  )
  const [t] = useTranslation()
  const [editor, setEditor] = useState({
    name: '',
    nameError: '',
    url: '',
    urlError: '',
  })
  useEffect(() => {
    if (cachedNetwork) {
      setEditor({
        name: cachedNetwork.name,
        nameError: '',
        url: cachedNetwork.remote,
        urlError: '',
      })
    }
  }, [cachedNetwork])
  const onChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const {
        value,
        dataset: { field = '' },
      } = e.target as HTMLInputElement
      let error = ''
      if (field === 'name') {
        const res = verifyNetworkName(value, usedNetworkNames)
        if (typeof res === 'object') {
          error = t(`messages.codes.${res.code}`, {
            fieldName: 'name',
            fieldValue: '',
            length: MAX_NETWORK_NAME_LENGTH,
          })
        }
      } else if (field === 'url') {
        const res = verifyURL(value)
        if (typeof res === 'object') {
          error = t(`messages.codes.${res.code}`, { fieldName: 'remote', fieldValue: value })
        }
      }
      setEditor(state => ({
        ...state,
        [field]: value,
        [`${field}Error`]: error,
      }))
    },
    [setEditor, t, usedNetworkNames]
  )
  const goBack = useGoBack(history)

  const handleSubmit = useHandleSubmit(id, editor.name, editor.url, networks, history, dispatch)

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t('settings.network.edit-network.title')}</h1>
      <Stack tokens={{ childrenGap: 15 }}>
        <TextField
          value={editor.url}
          field="url"
          onChange={onChange}
          label={t('settings.network.edit-network.rpc-url')}
          error={editor.urlError}
          placeholder="http://localhost:8114"
          required
        />
        <TextField
          value={editor.name}
          field="name"
          onChange={onChange}
          label={t('settings.network.edit-network.name')}
          error={editor.nameError}
          placeholder="My Custom Node"
          required
        />
      </Stack>
      <div className={styles.actions}>
        <Button type="cancel" label={t('common.cancel')} onClick={goBack} />
        <Button
          type="submit"
          label={isUpdating ? 'updating' : t('common.save')}
          onClick={handleSubmit}
          disabled={
            !!(
              editor.nameError ||
              editor.urlError ||
              (cachedNetwork && editor.name === cachedNetwork.name) ||
              isUpdating
            )
          }
        >
          {isUpdating ? <Spinner /> : (t('common.save') as string)}
        </Button>
      </div>
    </Stack>
  )
}

NetworkEditor.displayName = 'NetworkEditor'

export default NetworkEditor
