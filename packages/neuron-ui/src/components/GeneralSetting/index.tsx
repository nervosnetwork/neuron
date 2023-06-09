import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Dialog from 'widgets/Dialog'
import LanguageDialog from 'components/LanguageDialog'
import { ReactComponent as VersionLogo } from 'widgets/Icons/VersionLogo.svg'
import { checkForUpdates, downloadUpdate, installUpdate, getVersion } from 'services/remote'
import { LanguageSelect, CheckUpdateIcon } from 'widgets/Icons/icon'
import styles from './generalSetting.module.scss'

interface UpdateDowloadStatusProps {
  show: boolean
  onCancel: () => void
  progress: number
  newVersion: string
  releaseNotes: string
}

const UpdateDownloadStatus = ({
  show,
  onCancel,
  progress = 0,
  newVersion = '',
  releaseNotes = '',
}: UpdateDowloadStatusProps) => {
  const [t] = useTranslation()
  const available = newVersion !== '' && progress < 0
  const downloaded = progress >= 1

  if (available) {
    const releaseNotesHtml = () => {
      return { __html: releaseNotes }
    }

    /* eslint-disable react/no-danger */

    return (
      <Dialog
        show={show}
        onConfirm={downloadUpdate}
        disabled={!available}
        confirmText={t('updates.download-update')}
        onCancel={onCancel}
        title={t('updates.update-available')}
      >
        <div className={styles.install}>
          <p className={styles.title}>{newVersion}</p>
          <div className={styles.releaseNotesStyle}>
            <div dangerouslySetInnerHTML={releaseNotesHtml()} />
          </div>
        </div>
      </Dialog>
    )
  }

  if (downloaded) {
    return (
      <Dialog
        show={show}
        onCancel={onCancel}
        showCancel={false}
        onConfirm={installUpdate}
        disabled={!downloaded}
        confirmText={t('updates.quit-and-install')}
        title={t('updates.update-available')}
      >
        <div className={styles.install}>
          <div>{t('updates.updates-downloaded-about-to-quit-and-install')}</div>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog show={show} onCancel={onCancel} title={t('updates.update-available')} showConfirm={false}>
      <div className={styles.processWrap}>
        <p className={styles.title}>{t('updates.downloading-update')} </p>
        <progress value={progress} max={1} />
        <p className={styles.note}>{progress * 100}%</p>
      </div>
    </Dialog>
  )
}

interface GeneralSettingProps {
  updater: State.AppUpdater
}

const GeneralSetting = ({ updater }: GeneralSettingProps) => {
  const [t, i18n] = useTranslation()

  const [showCheck, setShowCheck] = useState(false)
  const [showLangDialog, setShowLangDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [searchParams] = useSearchParams()

  const [dialogType, setDialogType] = useState<'checking' | 'updating' | 'updated'>('checking')

  const checkUpdates = useCallback(() => {
    setShowCheck(true)
    checkForUpdates()
  }, [])

  const version = useMemo(() => {
    return getVersion()
  }, [])

  useEffect(() => {
    const checkUpdate = searchParams.get('checkUpdate')
    if (checkUpdate === '1') {
      setShowCheck(true)
    }
  }, [searchParams, setShowCheck])

  useEffect(() => {
    if (showCheck) {
      setShowUpdateDialog(true)
      if (updater.checking) {
        setDialogType('checking')
        return
      }
      if (updater.version || updater.downloadProgress > 0) {
        setDialogType('updating')
        return
      }
      setDialogType('updated')
    }
  }, [updater, showCheck])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p>
          {t('settings.general.version')} {version}
        </p>
        <button type="button" onClick={checkUpdates}>
          <CheckUpdateIcon />
          {t(`updates.check-updates`)}
        </button>
      </div>

      <div className={styles.content}>
        <p>
          {t('settings.general.language')} {version}
        </p>
        <button
          type="button"
          onClick={() => {
            setShowLangDialog(true)
          }}
        >
          <LanguageSelect />
          {t(`settings.locale.${i18n.language}`)}
        </button>
      </div>

      <Dialog
        show={['checking', 'updated'].includes(dialogType) && showUpdateDialog}
        showCancel={false}
        showHeader={false}
        confirmText={t(dialogType === 'checking' ? 'common.cancel' : 'common.ok')}
        onConfirm={() => setShowUpdateDialog(false)}
        className={styles.confirmDialog}
      >
        <div className={styles.wrap}>
          <VersionLogo />
          <p>{t(dialogType === 'checking' ? 'updates.checking-updates' : 'updates.update-not-available')}</p>
        </div>
      </Dialog>

      <UpdateDownloadStatus
        show={showCheck && dialogType === 'updating'}
        onCancel={() => {
          setShowCheck(false)
        }}
        progress={updater.downloadProgress}
        newVersion={updater.version}
        releaseNotes={updater.releaseNotes}
      />

      <LanguageDialog
        show={showLangDialog}
        close={() => {
          setShowLangDialog(false)
        }}
      />
    </div>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
