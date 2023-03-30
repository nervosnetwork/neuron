import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressIndicator } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import Dropdown from 'widgets/Dropdown'
import { checkForUpdates, downloadUpdate, installUpdate, setLocale, getVersion } from 'services/remote'
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
}

const GeneralSetting = ({ updater }: GeneralSettingProps) => {
  const [t, i18n] = useTranslation()
  const [lng, setLng] = useState(i18n.language)

  const checkUpdates = useCallback(() => {
    checkForUpdates()
  }, [])

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
      {showNewVersion ? (
        <div className={styles.newVersion}>
          <UpdateDownloadStatus
            progress={updater.downloadProgress}
            newVersion={updater.version}
            releaseNotes={updater.releaseNotes}
          />
        </div>
      ) : (
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
                <Spinner label={t('updates.checking-updates')} labelPosition="right" />
              ) : (
                (t('updates.check-updates') as string)
              )}
            </Button>
          </div>
        </>
      )}
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
        <Button label={t('settings.general.apply')} onClick={onApplyLanguage} disabled={lng === i18n.language} />
      </div>
    </div>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
