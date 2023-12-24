import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { createHardwareWallet } from 'services/remote'
import { CONSTANTS, isSuccessResponse, useDialogWrapper, ErrorCode } from 'utils'
import Alert from 'widgets/Alert'
import { FinishCreateLoading, getAlertStatus } from 'components/WalletWizard'
import { importedWalletDialogShown } from 'services/localCache'
import ReplaceDuplicateWalletDialog, { useReplaceDuplicateWallet } from 'components/ReplaceDuplicateWalletDialog'
import { ImportStep, ActionType, ImportHardwareState } from './common'

import styles from './findDevice.module.scss'

const { MAX_WALLET_NAME_LENGTH } = CONSTANTS

const NameWallet = ({
  dispatch,
  model,
  extendedPublicKey,
}: {
  dispatch: React.Dispatch<ActionType>
  model: ImportHardwareState['model']
  extendedPublicKey: ImportHardwareState['extendedPublicKey']
}) => {
  const [t] = useTranslation()
  const [walletName, setWalletName] = useState(`${model?.manufacturer} ${model?.product}`)
  const [errorMsg, setErrorMsg] = useState('')
  const { dialogRef, openDialog, closeDialog } = useDialogWrapper()
  const { onImportingExitingWalletError, dialogProps } = useReplaceDuplicateWallet()

  const onBack = useCallback(() => {
    dispatch({ step: ImportStep.ImportHardware })
  }, [dispatch])

  const onNext = useCallback(
    (e: React.FormEvent) => {
      openDialog()
      e.preventDefault()
      createHardwareWallet({
        ...extendedPublicKey!,
        walletName,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            dispatch({ step: ImportStep.Success })
            if (res.result) {
              importedWalletDialogShown.setStatus(res.result.id, true)
            }
          } else {
            if (res.status === ErrorCode.ImportingExitingWallet) {
              onImportingExitingWalletError(res.message)
              return
            }

            setErrorMsg(typeof res.message === 'string' ? res.message : res.message!.content!)
          }
        })
        .finally(() => {
          closeDialog()
        })
    },
    [walletName, extendedPublicKey, dispatch, setErrorMsg, openDialog, closeDialog]
  )

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletName(e.target.value)
    setErrorMsg('')
  }, [])

  return (
    <>
      <form className={styles.container}>
        <header className={styles.title}>{t('import-hardware.title.name-wallet')}</header>
        <section className={styles.name}>
          <TextField
            required
            autoFocus
            placeholder={t('wizard.set-wallet-name')}
            onChange={onInput}
            field="wallet-name"
            value={walletName}
            maxLength={MAX_WALLET_NAME_LENGTH}
          />
        </section>
        <Alert status={getAlertStatus(!!walletName, !errorMsg)} className={styles.alert}>
          <span>{errorMsg || t('wizard.new-name')}</span>
        </Alert>
        <footer className={styles.footer}>
          <Button
            type="submit"
            label={t('import-hardware.actions.finish')}
            onClick={onNext}
            disabled={!walletName || !!errorMsg}
          />
          <Button type="text" label={t('import-hardware.actions.back')} onClick={onBack} />
        </footer>
        <FinishCreateLoading dialogRef={dialogRef} />
      </form>

      <ReplaceDuplicateWalletDialog {...dialogProps} />
    </>
  )
}

NameWallet.displayName = 'NameWallet'

export default NameWallet
