import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'

import { useState as useGlobalState, useDispatch } from 'states'

import { RoutePath, ErrorCode } from 'utils'

import { useHint, useOnSubmit, useInputs, useWalletEditor } from './hooks'

const WalletNotFound = () => {
  const [t] = useTranslation()
  return (
    <div>
      <p>{t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'wallet' })}</p>
      <Link to={RoutePath.SettingsWallets} className="btn btn-primary">
        {`${t('settings.title')}-${t('settings.setting-tabs.wallets')}`}
      </Link>
    </div>
  )
}

const WalletEditorDialog = ({ show, onCancel, id }: { show: boolean; onCancel: () => void; id: string }) => {
  const {
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets]) || { id: '', name: '' }
  const usedNames = wallets.map(w => w.name).filter(w => w !== wallet.name)

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [initialize, wallet.name])

  const inputs = useInputs(editor)
  const hint = useHint(editor.name.value, usedNames, t)
  const disabled = hint !== null || editor.name.value === wallet.name

  const onSubmit = useOnSubmit(editor.name.value, wallet.id, dispatch, disabled, onCancel)

  return (
    <Dialog
      show={show}
      title={t('settings.wallet-manager.edit-wallet.edit-wallet')}
      onCancel={onCancel}
      onConfirm={onSubmit}
      confirmText={t('common.save')}
      disabled={disabled}
    >
      <>
        {wallet.id ? (
          <div>
            {inputs.map(item => (
              <TextField key={item.label} {...item} field={item.label} error={hint} autoFocus />
            ))}
          </div>
        ) : (
          <WalletNotFound />
        )}
      </>
    </Dialog>
  )
}

WalletEditorDialog.displayName = 'WalletEditorDialog'

export default WalletEditorDialog
