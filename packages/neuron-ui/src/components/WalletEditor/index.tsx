import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory, useRouteMatch } from 'react-router-dom'
import { Stack } from 'office-ui-fabric-react'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'

import { useState as useGlobalState, useDispatch } from 'states'

import { RoutePath, ErrorCode, useGoBack } from 'utils'

import { useHint, useOnSubmit, useInputs, useWalletEditor } from './hooks'

const WalletNotFound = () => {
  const [t] = useTranslation()
  return (
    <div>
      <p>{t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'wallet' })}</p>
      <Link to={RoutePath.SettingsWallets} className="btn btn-primary">
        {`${t('navbar.settings')}-${t('settings.setting-tabs.wallets')}`}
      </Link>
    </div>
  )
}

const WalletEditor = () => {
  const {
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()
  const {
    params: { id },
  } = useRouteMatch()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets]) || { id: '', name: '' }
  const usedNames = wallets.map(w => w.name).filter(w => w !== wallet.name)

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [id, initialize, wallet.name])

  const inputs = useInputs(editor)
  const hint = useHint(editor.name.value, usedNames, t)
  const disabled = hint !== null || editor.name.value === wallet.name

  const goBack = useGoBack(history)
  const onSubmit = useOnSubmit(editor.name.value, wallet.id, history, dispatch, disabled)

  if (!wallet.id) {
    return <WalletNotFound />
  }

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <form onSubmit={onSubmit}>
        <h1>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</h1>
        <Stack tokens={{ childrenGap: 15 }}>
          {inputs.map(inputProps => (
            <Stack.Item key={inputProps.label}>
              <TextField {...inputProps} field={inputProps.label} required error={hint || undefined} autoFocus />
            </Stack.Item>
          ))}
        </Stack>
        <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
          <Button type="cancel" onClick={goBack} label={t('common.cancel')} />
          <Button type="submit" label={t('common.save')} disabled={disabled} />
        </Stack>
      </form>
    </Stack>
  )
}

WalletEditor.displayName = 'WalletEditor'

export default WalletEditor
