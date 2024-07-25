import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { validateNetworkName, validateURL } from 'utils'
import { useState as useGlobalState, useDispatch } from 'states'
import { isErrorWithI18n } from 'exceptions'
import { NetworkType } from 'utils/const'
import { useOnSubmit } from './hooks'
import styles from './networkEditorDialog.module.scss'

const NetworkEditorDialog = ({
  onCancel,
  id,
  onSuccess,
  url,
}: {
  onCancel: () => void
  id: 'new' | string
  onSuccess: () => void
  url?: string
}) => {
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
    type: 0,
    name: '',
    nameError: '',
    url: url ?? '',
    urlError: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const disabled = !!(
    !editor.type ||
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
        type: cachedNetwork.type,
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
      let fieldValue: string | number = value
      try {
        if (field === 'name') {
          validateNetworkName(value, usedNetworkNames)
        } else if (field === 'url') {
          validateURL(value)
        } else if (field === 'type') {
          fieldValue = Number(value)
        }
      } catch (err) {
        if (isErrorWithI18n(err)) {
          error = t(err.message, err.i18n)
        }
      }

      setEditor(state => ({
        ...state,
        [field]: fieldValue,
        [`${field}Error`]: error,
      }))
    },
    [setEditor, t, usedNetworkNames]
  )

  const onSubmit = useOnSubmit({
    id: id!,
    name: editor.name,
    remote: editor.url,
    networkType: editor.type,
    networks,
    callback: onSuccess,
    dispatch,
    disabled,
    setIsUpdating,
  })

  return (
    <Dialog
      show
      title={id === 'new' ? t('settings.network.add-network') : t('settings.network.edit-network.title')}
      onCancel={onCancel}
      onConfirm={onSubmit}
      disabled={disabled}
      cancelText={t('wizard.back')}
      confirmText={id === 'new' ? t('common.ok') : t('common.save')}
      isLoading={isUpdating}
    >
      <div className={styles.container}>
        <div className={styles.radioGroup}>
          <p className={styles.label}>{t('settings.network.type')}</p>
          {[
            { value: `${NetworkType.Normal}`, label: t('settings.network.full-node') },
            { value: `${NetworkType.Light}`, label: t('settings.network.light-client-node') },
          ].map(item => (
            <div className={styles.radioItem} key={item.value}>
              <label htmlFor={item.value}>
                <input
                  id={item.value}
                  type="radio"
                  value={item.value}
                  data-field="type"
                  checked={Number(item.value) === editor.type}
                  onChange={onChange}
                />
                <span>{item.label}</span>
              </label>
            </div>
          ))}
        </div>
        <TextField
          value={editor.url}
          field="url"
          onChange={onChange}
          label={t('settings.network.edit-network.rpc-url')}
          error={editor.urlError}
          placeholder={t('settings.network.edit-network.input-rpc')}
          autoFocus
          disabled={!!url}
          className={styles.rpcItem}
        />
        <TextField
          value={editor.name}
          field="name"
          onChange={onChange}
          label={t('settings.network.edit-network.name')}
          error={editor.nameError}
          placeholder={t('settings.network.edit-network.input-network')}
        />
      </div>
    </Dialog>
  )
}

NetworkEditorDialog.displayName = 'NetworkEditorDialog'

export default NetworkEditorDialog
