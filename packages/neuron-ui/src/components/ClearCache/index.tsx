import React, { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from 'widgets/Spinner'
import Dialog from 'widgets/Dialog'
import Toast from 'widgets/Toast'
import { StateDispatch, addPopup } from 'states'
import { clearCellCache } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { isSuccessResponse, uniformTimeFormatter } from 'utils'
import styles from './clearCache.module.scss'

const I18N_PATH = 'settings.clear-cache'
const IDs = {
  submitClearCache: 'submit-clear-cache',
  refreshCacheOption: 'refresh-cache-option',
  rebuildCacheOption: 'rebuild-cache-option',
}

const ClearCacheDialog = ({
  dispatch,
  className,
  btnClassName,
  hideRebuild,
}: {
  dispatch: StateDispatch
  className?: string
  btnClassName?: string
  hideRebuild?: boolean
}) => {
  const [t] = useTranslation()
  const [clearedDate, setClearedDate] = useState(cacheClearDate.load())
  const [isClearing, setIsClearing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRebuild, setIsRebuild] = useState(false)
  const [notice, setNotice] = useState('')

  const showDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [setIsDialogOpen])

  const dismissDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  const toggleIsRebuild = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsRebuild(e.target.checked)
    },
    [setIsRebuild]
  )

  useEffect(() => {
    if (isDialogOpen) {
      /* eslint-disable-next-line no-unused-expressions */
      document.querySelector<HTMLButtonElement>(`#${IDs.submitClearCache}`)?.focus()
    } else {
      setIsRebuild(false)
    }
  }, [isDialogOpen, setIsRebuild])

  const handleSubmit = useCallback(() => {
    setIsDialogOpen(false)
    setIsClearing(true)
    clearCellCache({ resetIndexerData: isRebuild })
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
  }, [dispatch, setClearedDate, setIsDialogOpen, isRebuild])

  return (
    <>
      <div className={className}>
        <span className={styles.clearTime}>{t('settings.data.cache-cleared-on', { date: clearedDate })}</span>
        <button
          type="button"
          className={`${btnClassName} ${styles.clearBtn}`}
          onClick={showDialog}
          disabled={isClearing}
        >
          {t('settings.data.clear-cache')}
        </button>
      </div>

      <Dialog show={isClearing} showHeader={false} showFooter={false}>
        <div className={styles.clearDialog}>
          <Spinner size={3} />
          <p>{t('settings.data.clearing-cache')}</p>
        </div>
      </Dialog>

      <Dialog
        show={isDialogOpen}
        title={t(`${I18N_PATH}.title`)}
        onConfirm={handleSubmit}
        onCancel={dismissDialog}
        confirmText={t('settings.data.confirm-clear')}
        confirmProps={{ id: IDs.submitClearCache }}
      >
        <div className={styles.options}>
          <label htmlFor={IDs.refreshCacheOption}>
            <input type="checkbox" id={IDs.refreshCacheOption} checked disabled />
            <span className={styles.highlight}>{t(`${I18N_PATH}.options.refresh.label`)}</span>
          </label>
          {hideRebuild ? null : (
            <label htmlFor={IDs.rebuildCacheOption}>
              <input type="checkbox" id={IDs.rebuildCacheOption} checked={isRebuild} onChange={toggleIsRebuild} />
              <span>{t(`${I18N_PATH}.options.rebuild.label`)}</span>
            </label>
          )}
        </div>
      </Dialog>

      <Toast content={notice} onDismiss={() => setNotice('')} />
    </>
  )
}

ClearCacheDialog.displayName = 'ClearCacheDialog'
export default ClearCacheDialog
