import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'
import { ReactComponent as PendingIcon } from 'widgets/Icons/Pending.svg'
import { getPublickey } from 'services/remote'
import { isSuccessResponse, useDidMount } from 'utils'
import { RoutePath, LocationState } from './common'

import styles from './findDevice.module.scss'

const Confirming = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const { entryPath } = location.state
  const onBack = useCallback(() => {
    history.goBack()
  }, [history])

  useDidMount(() => {
    getPublickey().then(res => {
      if (isSuccessResponse(res)) {
        history.push({
          pathname: entryPath + RoutePath.NameWallet,
          state: {
            ...location.state,
            extendedPublicKey: res.result!,
          },
        })
      } else {
        history.push({
          pathname: entryPath + RoutePath.Error,
          state: {
            ...location.state,
            error: res.message,
          },
        })
      }
    })
  })

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span className={styles.rotating}>
          <PendingIcon />
        </span>
        <div className={styles.message}>{t('import-hardware.actions.confirm')}</div>
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
      </footer>
    </div>
  )
}

Confirming.displayName = 'Confirming'

export default Confirming
