import React, { useEffect, useCallback, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import WarningIcon from 'widgets/Icons/Warning.png'
import { StateDispatch, addPopup } from 'states'
import { clearCellCache } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { isSuccessResponse, useDialog, uniformTimeFormatter } from 'utils'

import { Tooltip } from 'widgets/Icons/icon'
import styles from './style.module.scss'

const I18N_PATH = 'settings.clear-cache'
const IDs = {
  submitClearCache: 'submit-clear-cache',
  refreshCacheOption: 'refresh-cache-option',
  rebuildCacheOption: 'rebuild-cache-option',
}

const ClearCache = ({ dispatch, hideRebuild }: { dispatch: StateDispatch; hideRebuild?: boolean }) => {
  const [t] = useTranslation()
  const [clearedDate, setClearedDate] = useState(cacheClearDate.load())
  const [isClearing, setIsClearing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRebuild, setIsRebuild] = useState(false)
  const dialogRef = useRef<HTMLDialogElement | null>(null)

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

  useDialog({ show: isDialogOpen, dialogRef, onClose: dismissDialog })

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
        }
      })
      .finally(() => {
        setIsClearing(false)
      })
  }, [dispatch, setClearedDate, setIsDialogOpen, isRebuild])

  return (
    <>
      <div className={styles.clearCache}>
        {t('settings.data.cache')}
        <span className={styles.tooltip} data-tooltip={t('settings.data.clear-cache-description')}>
          <Tooltip />
        </span>
        :
      </div>
      <div className={styles.clearedDate}>{t('settings.data.cache-cleared-on', { date: clearedDate })}</div>
      <Button label={t('settings.data.clear-cache')} onClick={showDialog} disabled={isClearing}>
        {isClearing ? (
          <Spinner
            label={t('settings.data.clearing-cache')}
            labelPosition="right"
            styles={{ root: { marginRight: 5 } }}
          />
        ) : (
          (t('settings.data.clear-cache') as string)
        )}
      </Button>
      <dialog ref={dialogRef} className={styles.dialog}>
        <img src={WarningIcon} alt="warning" className={styles.warningIcon} />
        <div className={styles.title}>{t(`${I18N_PATH}.title`)}</div>
        <div className={styles.options}>
          <input type="checkbox" id={IDs.refreshCacheOption} checked disabled />
          <label htmlFor={IDs.refreshCacheOption}>{t(`${I18N_PATH}.options.refresh.label`)}</label>
          {hideRebuild ? null : (
            <>
              <input type="checkbox" id={IDs.rebuildCacheOption} checked={isRebuild} onChange={toggleIsRebuild} />
              <label htmlFor={IDs.rebuildCacheOption}>{t(`${I18N_PATH}.options.rebuild.label`)}</label>
            </>
          )}
        </div>
        <div className={styles.footer}>
          <Button type="submit" label={t(`${I18N_PATH}.buttons.ok`)} onClick={handleSubmit} id={IDs.submitClearCache} />
          <Button type="cancel" label={t(`${I18N_PATH}.buttons.cancel`)} onClick={dismissDialog} />
        </div>
      </dialog>
    </>
  )
}

ClearCache.displayName = 'ClearCache'
export default ClearCache
