import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { createHardwareWallet } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { RoutePath, LocationState } from './common'

import styles from './findDevice.module.scss'

const NameWallet = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const { entryPath, model, extendedPublicKey } = location.state
  const [walletName, setWalletName] = useState(`${model.manufacturer} ${model.product}`)
  const [errorMsg, setErrorMsg] = useState('')

  const onBack = useCallback(() => {
    history.push(entryPath)
  }, [history, entryPath])

  const onNext = useCallback(() => {
    createHardwareWallet({
      ...extendedPublicKey!,
      walletName,
    }).then(res => {
      if (isSuccessResponse(res)) {
        history.push({
          pathname: entryPath + RoutePath.Success,
          state: location.state,
        })
      } else {
        setErrorMsg(typeof res.message === 'string' ? res.message : res.message!.content!)
      }
    })
    history.push({
      pathname: entryPath + RoutePath.Success,
      state: location.state,
    })
  }, [history, entryPath, walletName, location.state, extendedPublicKey])

  const onInput = useCallback(e => {
    setWalletName(e.target.value)
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
