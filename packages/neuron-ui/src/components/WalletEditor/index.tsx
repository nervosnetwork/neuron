import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, Link } from 'react-router-dom'
import { Stack, TextField, PrimaryButton, DefaultButton } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

import { Routes, ErrorCode } from 'utils/const'

import { useGoBack } from 'utils/hooks'
import { useHint, useOnConfirm, useInputs, useWalletEditor } from './hooks'

const WalletNotFound = () => {
  const [t] = useTranslation()
  return (
    <div>
      <p>{t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'wallet' })}</p>
      <Link to={Routes.SettingsWallets} className="btn btn-primary">
        {`${t('navbar.settings')}-${t('settings.setting-tabs.wallets')}`}
      </Link>
    </div>
  )
}

const WalletEditor = ({
  settings: { wallets = [] },
  history,
  dispatch,
  match: {
    params: { id },
  },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ id: string }>>) => {
  const [t] = useTranslation()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets]) || { id: '', name: '' }
  const usedNames = wallets.map(w => w.name).filter(n => n !== wallet.name)

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [id, initialize, wallet.name])

  const inputs = useInputs(editor)
  const hint = useHint(editor.name.value, usedNames, t)
  const onConfirm = useOnConfirm(editor.name.value, wallet.id, history, dispatch)
  const goBack = useGoBack(history)

  if (!wallet.id) {
    return <WalletNotFound />
  }

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <h1>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</h1>
      <Stack tokens={{ childrenGap: 15 }}>
        {inputs.map(inputProps => (
          <Stack.Item key={inputProps.label}>
            <TextField {...inputProps} key={inputProps.label} required errorMessage={hint || undefined} />
          </Stack.Item>
        ))}
      </Stack>
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <DefaultButton onClick={goBack} text={t('common.cancel')} ariaLabel="cancel" />
        <PrimaryButton
          onClick={onConfirm}
          disabled={hint !== null || editor.name.value === wallet.name}
          text={t('common.save')}
          ariaLabel="save wallet"
          name="save-wallet"
        />
      </Stack>
    </Stack>
  )
}

WalletEditor.displayName = 'WalletEditor'

export default WalletEditor
