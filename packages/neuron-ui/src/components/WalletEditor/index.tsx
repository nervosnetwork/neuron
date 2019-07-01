import React, { useCallback, useEffect, useMemo } from 'react'
import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'
import { Stack, TextField, PrimaryButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, Link } from 'react-router-dom'
import { useNeuronWallet } from 'utils/hooks'
import { Routes } from 'utils/const'
import { useAreParamsValid, useInputs, useToggleDialog, useWalletEditor } from './hooks'

export default ({
  dispatch,
  match: {
    params: { id },
  },
}: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const [t] = useTranslation()
  const {
    settings: { wallets },
  } = useNeuronWallet()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets])

  if (!wallet) {
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

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [id, initialize, wallet.name])

  const inputs = useInputs(editor)
  const areParamsValid = useAreParamsValid(editor.name.value)
  const toggleDialog = useToggleDialog(dispatch)

  const handleConfirm = useCallback(() => {
    toggleDialog(false)
    dispatch(
      actionCreators.updateWallet({
        id: wallet.id,
        name: editor.name.value,
      })
    )
  }, [editor.name.value, wallet.id, dispatch, toggleDialog])

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
