import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, Link } from 'react-router-dom'
import { Stack, TextField, PrimaryButton } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes } from 'utils/const'

import { useAreParamsValid, useOnConfirm, useInputs, useWalletEditor } from './hooks'

const WalletNotFound = () => {
  const [t] = useTranslation()
  return (
    <div>
      <p>{t('messages.wallet-is-not-found')}</p>
      <Link to={Routes.SettingsWallets} className="btn btn-primary">
        {`${t('navbar.settings')}-${t('settings.setting-tabs.wallets')}`}
      </Link>
    </div>
  )
}

const WalletEditor = ({
  settings: { wallets = [] },
  dispatch,
  match: {
    params: { id },
  },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ id: string }>>) => {
  const [t] = useTranslation()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets]) || { id: '', name: '' }

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [id, initialize, wallet.name])

  const inputs = useInputs(editor)
  const areParamsValid = useAreParamsValid(editor.name.value)
  const onConfirm = useOnConfirm(editor.name.value, wallet.id, dispatch)

  if (!wallet.id) {
    return <WalletNotFound />
  }

  return (
    <Stack>
      <Stack.Item>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</Stack.Item>
      <Stack.Item>
        {inputs.map(inputProps => (
          <TextField {...inputProps} key={inputProps.label} required />
        ))}
        <PrimaryButton onClick={onConfirm} disabled={!areParamsValid} text={t('common.save')} />
      </Stack.Item>
    </Stack>
  )
}

WalletEditor.displayName = 'WalletEditor'

export default WalletEditor
