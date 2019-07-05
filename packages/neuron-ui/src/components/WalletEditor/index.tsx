import React, { useCallback, useEffect, useMemo } from 'react'
import { Stack, TextField, PrimaryButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, Link } from 'react-router-dom'
import { Routes } from 'utils/const'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'
import { useAreParamsValid, useInputs, useWalletEditor } from './hooks'

const WalletEditor = ({
  dispatch,
  settings: { wallets },
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

  const handleConfirm = useCallback(() => {
    dispatch(
      actionCreators.updateWallet({
        id: wallet.id,
        name: editor.name.value,
      })
    )
  }, [editor.name.value, wallet.id, dispatch])

  if (!wallet.id) {
    const label = `${t('navbar.settings')}-${t('settings.setting-tabs.wallets')}`
    return (
      <div>
        <p>{t('messages.wallet-is-not-found')}</p>
        <Link to={Routes.SettingsWallets} className="btn btn-primary">
          {label}
        </Link>
      </div>
    )
  }

  return (
    <Stack>
      <Stack.Item>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</Stack.Item>
      <Stack.Item>
        {inputs.map(inputProps => (
          <TextField {...inputProps} key={inputProps.label} required />
        ))}
        <PrimaryButton onClick={handleConfirm} disabled={!areParamsValid} text={t('common.save')} />
      </Stack.Item>
    </Stack>
  )
}

WalletEditor.displayName = 'WalletEditor'

export default WalletEditor
