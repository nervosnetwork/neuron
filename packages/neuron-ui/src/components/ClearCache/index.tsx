import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { StateDispatch, addPopup } from 'states'
import { clearCellCache } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { isSuccessResponse } from 'utils'

import styles from './style.module.scss'

const ClearCache = ({ dispatch }: { dispatch: StateDispatch }) => {
  const [t] = useTranslation()
  const [clearingCache, setClearingCache] = useState(false)
  const [clearedDate, setClearedDate] = useState(cacheClearDate.load())

  const clearCache = useCallback(() => {
    setClearingCache(true)
    clearCellCache()
      .then(res => {
        if (isSuccessResponse(res) && res.result) {
          addPopup('clear-cache-successfully')(dispatch)
          const date = new Date().toISOString().slice(0, 10)
          cacheClearDate.save(date)
          setClearedDate(date)
        }
      })
      .finally(() => {
        setClearingCache(false)
      })
  }, [dispatch, setClearedDate])

  return (
    <>
      <div className={`${styles.clearCache} ${styles.detail}`}>
        {clearedDate ? (
          <div className={styles.date}>{t('settings.general.cache-cleared-on', { date: clearedDate })}</div>
        ) : null}
        <div className={styles.desc}>
          <Attention />
          {t('settings.general.clear-cache-description')}
        </div>
      </div>
      <div className={`${styles.clearCache} ${styles.action}`}>
        <Button type="default" label={t(`settings.general.clear-cache`)} onClick={clearCache} disabled={clearingCache}>
          {clearingCache ? (
            <Spinner
              styles={{ root: { marginRight: 5 } }}
              label={t('settings.general.clear-cache')}
              labelPosition="right"
            />
          ) : (
            (t('settings.general.clear-cache') as string)
          )}
        </Button>
      </div>
    </>
  )
}

ClearCache.displayName = 'ClearCache'
export default ClearCache
