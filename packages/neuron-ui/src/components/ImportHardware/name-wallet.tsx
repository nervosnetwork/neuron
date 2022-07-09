import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { createHardwareWallet } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { ImportStep, ActionType, ImportHardwareState } from './common'

import styles from './findDevice.module.scss'

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

  const onBack = useCallback(() => {
    dispatch({ step: ImportStep.ImportHardware })
  }, [dispatch])

  const onNext = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      createHardwareWallet({
        ...extendedPublicKey!,
        walletName,
      }).then(res => {
        if (isSuccessResponse(res)) {
          dispatch({ step: ImportStep.Success })
        } else {
          setErrorMsg(typeof res.message === 'string' ? res.message : res.message!.content!)
        }
      })
    },
    [walletName, extendedPublicKey]
  )

  const onInput = useCallback(e => {
    setWalletName(e.target.value)
    setErrorMsg('')
  }, [])

  return (
    <form className={styles.container}>
      <header className={styles.title}>{t('import-hardware.title.name-wallet')}</header>
      <section className={styles.main}>
        <TextField
          required
          autoFocus
          label={t('import-hardware.wallet-name')}
          onChange={onInput}
          field="wallet-name"
          value={walletName}
          error={errorMsg}
        />
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
        <Button type="submit" label={t('import-hardware.actions.next')} onClick={onNext} />
      </footer>
    </form>
  )
}

NameWallet.displayName = 'NameWallet'

export default NameWallet
