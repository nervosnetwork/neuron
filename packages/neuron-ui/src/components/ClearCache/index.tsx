import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from 'widgets/Spinner'
import Toast from 'widgets/Toast'
import { StateDispatch, addPopup } from 'states'
import { clearCellCache } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { isSuccessResponse, uniformTimeFormatter } from 'utils'
import styles from './clearCache.module.scss'

const ClearCache = ({
  dispatch,
  className,
  btnClassName,
}: {
  dispatch: StateDispatch
  className?: string
  btnClassName?: string
}) => {
  const [t] = useTranslation()
  const [clearedDate, setClearedDate] = useState(cacheClearDate.load())
  const [isClearing, setIsClearing] = useState(false)
  const [notice, setNotice] = useState('')

  const handleSubmit = useCallback(() => {
    setIsClearing(true)
    clearCellCache()
      .then(res => {
        if (isSuccessResponse(res) && res.result) {
          addPopup('clear-cache-successfully')(dispatch)
          const date = uniformTimeFormatter(Date.now()).substr(0, 10)
          cacheClearDate.save(date)
          setClearedDate(date)
          setNotice(t('settings.data.clear-success'))
        }
      })
      .finally(() => {
        setIsClearing(false)
      })
  }, [dispatch, setClearedDate])

  return (
    <>
      <div className={className}>
        <span className={styles.clearTime}>{t('settings.data.cache-cleared-on', { date: clearedDate })}</span>
        <button
          type="button"
          className={`${btnClassName} ${styles.clearBtn}`}
          onClick={handleSubmit}
          disabled={isClearing}
        >
          {isClearing ? (
            <>
              <Spinner className={styles.spinner} />
              &nbsp;&nbsp;
              {t('settings.data.clearing-cache')}
            </>
          ) : (
            t('settings.data.refresh')
          )}
        </button>
      </div>
      <Toast content={notice} onDismiss={() => setNotice('')} />
    </>
  )
}

ClearCache.displayName = 'ClearCache'
export default ClearCache
