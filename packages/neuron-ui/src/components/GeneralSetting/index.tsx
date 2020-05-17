import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressIndicator } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import Dropdown from 'widgets/Dropdown'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { StateDispatch, addPopup } from 'states'
import { checkForUpdates, downloadUpdate, installUpdate, clearCellCache, setLocale, getVersion } from 'services/remote'
import { cacheClearDate } from 'services/localCache'
import { CONSTANTS } from 'utils'

import styles from './style.module.scss'

const { LOCALES } = CONSTANTS
interface UpdateDowloadStatusProps {
  progress: number
  newVersion: string
  releaseNotes: string
}

const UpdateDownloadStatus = ({ progress = 0, newVersion = '', releaseNotes = '' }: UpdateDowloadStatusProps) => {
  const [t] = useTranslation()
  const available = newVersion !== '' && progress < 0
  const downloaded = progress >= 1

  if (available) {
    const download = () => {
      downloadUpdate()
    }

    const releaseNotesHtml = () => {
      return { __html: releaseNotes }
    }

    /* eslint-disable react/no-danger */

    return (
      <div className={styles.install}>
        <div>{t('updates.updates-found-do-you-want-to-update', { version: newVersion })}</div>
        <div>
          <Button type="primary" onClick={download} disabled={!available} label={t('updates.download-update')} />
        </div>
        <div className={styles.releaseNotesStyle}>
          <div dangerouslySetInnerHTML={releaseNotesHtml()} />
        </div>
      </div>
    )
  }

  if (downloaded) {
    const quitAndInstall = () => {
      installUpdate()
    }

    return (
      <div className={styles.install}>
        <div>{t('updates.updates-downloaded-about-to-quit-and-install')}</div>
        <div>
          <Button
            type="primary"
            onClick={quitAndInstall}
            disabled={!downloaded}
            label={t('updates.quit-and-install')}
          />
        </div>
      </div>
    )
  }

  return <ProgressIndicator percentComplete={progress} label={t('updates.downloading-update')} />
}

interface GeneralSettingProps {
  updater: State.AppUpdater
  dispatch: StateDispatch
}

const GeneralSetting = ({ updater, dispatch }: GeneralSettingProps) => {
  const [t, i18n] = useTranslation()
  const [clearingCache, setClearingCache] = useState(false)
  const [lng, setLng] = useState(i18n.language)
  const [clearedDate, setClearedDate] = useState(cacheClearDate.load())

  const checkUpdates = useCallback(() => {
    checkForUpdates()
  }, [])

  const clearCache = useCallback(() => {
    setClearingCache(true)
    setTimeout(() => {
      clearCellCache().finally(() => {
        addPopup('clear-cache-successfully')(dispatch)
        const date = new Date().toISOString().slice(0, 10)
        cacheClearDate.save(date)
        setClearedDate(date)
        setClearingCache(false)
      })
    }, 100)
  }, [dispatch, setClearedDate])

  const onApplyLanguage = useCallback(() => {
    setLocale(lng as typeof LOCALES[number])
  }, [lng])

  const version = useMemo(() => {
    return getVersion()
  }, [])

  const showNewVersion = updater.version !== '' || updater.downloadProgress >= 0

  return (
    <div className={styles.container}>
      <div className={`${styles.version} ${styles.label}`}>{t('settings.general.version')}</div>
      {showNewVersion ? null : (
        <>
          <div className={`${styles.version} ${styles.value}`}>{version}</div>
          <div className={`${styles.version} ${styles.action}`}>
            <Button
              label={t(`updates.${updater.checking ? 'checking-updates' : 'check-updates'}`)}
              type="default"
              onClick={checkUpdates}
              disabled={updater.checking}
            >
              {updater.checking ? (
                <Spinner
                  styles={{ root: { marginRight: 5 } }}
                  label={t('updates.checking-updates')}
                  labelPosition="right"
                />
              ) : (
                (t('updates.check-updates') as string)
              )}
            </Button>
          </div>
        </>
      )}
      <div className={styles.newVersion}>
        {showNewVersion ? (
          <UpdateDownloadStatus
            progress={updater.downloadProgress}
            newVersion={updater.version}
            releaseNotes={updater.releaseNotes}
          />
        ) : null}
      </div>

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
        <Button
          type="default"
          label={t(`settings.general.${clearingCache ? 'clearing-cache' : 'clear-cache'}`)}
          onClick={clearCache}
          disabled={clearingCache}
        >
          {clearingCache ? (
            <Spinner
              styles={{ root: { marginRight: 5 } }}
              label={t('settings.general.clearing-cache')}
              labelPosition="right"
            />
          ) : (
            (t('settings.general.clear-cache') as string)
          )}
        </Button>
      </div>
      <div className={`${styles.language} ${styles.label}`}>{t('settings.general.language')}</div>
      <div className={`${styles.language} ${styles.select}`}>
        <Dropdown
          options={LOCALES.map(locale => ({ key: locale, text: t(`settings.locale.${locale}`) }))}
          selectedKey={lng}
          onChange={(_, item) => {
            if (item) {
              setLng(item.key as typeof LOCALES[number])
            }
          }}
        />
      </div>
      <div className={`${styles.language} ${styles.action}`}>
        <Button label="Apply" onClick={onApplyLanguage} disabled={lng === i18n.language} />
      </div>
    </div>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
