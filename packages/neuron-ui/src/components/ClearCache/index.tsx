import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from 'widgets/Spinner'
import Dialog from 'widgets/Dialog'
import Toast from 'widgets/Toast'
import { StateDispatch, addPopup } from 'states'
import { clearCellCache } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { isSuccessResponse, uniformTimeFormatter } from 'utils'
import styles from './clearCache.module.scss'

const ClearCacheDialog = ({
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
          {t('settings.data.refresh')}
        </button>
      </div>

      <Dialog show={isClearing} showHeader={false} showFooter={false}>
        <div className={styles.clearDialog}>
          <Spinner size={3} />
          <p>{t('settings.data.clearing-cache')}</p>
        </div>
      </Dialog>
      <Toast content={notice} onDismiss={() => setNotice('')} />
    </>
  )
}

ClearCacheDialog.displayName = 'ClearCacheDialog'
export default ClearCacheDialog
