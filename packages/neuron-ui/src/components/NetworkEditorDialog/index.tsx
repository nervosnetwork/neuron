import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { validateNetworkName, validateURL } from 'utils'
import { useState as useGlobalState, useDispatch } from 'states'
import { isErrorWithI18n } from 'exceptions'
import { useOnSubmit } from './hooks'
import styles from './networkEditorDialog.module.scss'

const NetworkEditorDialog = ({ show, close, id }: { show: boolean; close: () => void; id: 'new' | string }) => {
  const {
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
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
  const [isUpdating, setIsUpdating] = useState(false)

  const disabled = !!(
    !editor.name ||
    !editor.url ||
    editor.nameError ||
    editor.urlError ||
    (cachedNetwork && editor.name === cachedNetwork.name && editor.url === cachedNetwork.remote) ||
    isUpdating
  )

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
      try {
        if (field === 'name') {
          validateNetworkName(value, usedNetworkNames)
        } else if (field === 'url') {
          validateURL(value)
        }
      } catch (err) {
        if (isErrorWithI18n(err)) {
          error = t(err.message, err.i18n)
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

  const onSubmit = useOnSubmit({
    id: id!,
    name: editor.name,
    remote: editor.url,
    networks,
    callback: close,
    dispatch,
    disabled,
    setIsUpdating,
  })

  return (
    <Dialog
      show={show}
      title={id === 'new' ? t('settings.network.add-network') : t('settings.network.edit-network.title')}
      onCancel={close}
      onConfirm={onSubmit}
      disabled={disabled}
      cancelText={t('wizard.back')}
      confirmText={id === 'new' ? t('common.ok') : t('common.save')}
      isLoading={isUpdating}
    >
      <div className={styles.container}>
        <TextField
          value={editor.url}
          field="url"
          onChange={onChange}
          label={t('settings.network.edit-network.rpc-url')}
          error={editor.urlError}
          placeholder="http://127.0.0.1:8114"
          autoFocus
        />
        <TextField
          value={editor.name}
          field="name"
          onChange={onChange}
          label={t('settings.network.edit-network.name')}
          error={editor.nameError}
          placeholder="My Custom Node"
        />
      </div>
    </Dialog>
  )
}

NetworkEditorDialog.displayName = 'NetworkEditorDialog'

export default NetworkEditorDialog
