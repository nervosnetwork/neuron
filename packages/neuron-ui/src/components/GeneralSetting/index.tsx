import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Dialog from 'widgets/Dialog'
import LanguageDialog from 'components/LanguageDialog'
import AlertDialog from 'widgets/AlertDialog'
import { ReactComponent as VersionLogo } from 'widgets/Icons/VersionLogo.svg'
import { ReactComponent as ArrowNext } from 'widgets/Icons/ArrowNext.svg'
import {
  checkForUpdates,
  cancelCheckUpdates,
  downloadUpdate,
  cancelDownloadUpdate,
  installUpdate,
  getVersion,
} from 'services/remote'
import { uniformTimeFormatter, bytesFormatter } from 'utils'
import { LanguageSelect } from 'widgets/Icons/icon'
import styles from './generalSetting.module.scss'

interface UpdateDowloadStatusProps {
  show: boolean
  onCancel: () => void
  progress: number
  newVersion: string
  releaseDate: string
  releaseNotes: string
  progressInfo: object
}

const UpdateDownloadStatus = ({
  show,
  onCancel,
  progress = 0,
  newVersion = '',
  releaseDate = '',
  releaseNotes = '',
  progressInfo = {},
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
        confirmText={t('updates.install-update')}
        onCancel={onCancel}
        title={t('updates.update-available')}
      >
        <div className={styles.install}>
          <p className={styles.title}>
            {newVersion} ({uniformTimeFormatter(new Date(releaseDate)).split(' ')[0]})
          </p>
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

  const { total, transferred } = progressInfo as { total: number; transferred: number }

  return (
    <Dialog show={show} onCancel={onCancel} title={t('updates.update-available')} showConfirm={false}>
      <div className={styles.processWrap}>
        <p className={styles.title}>{t('updates.downloading-update')} </p>
        <progress value={progress} max={1} />
        <p className={styles.note}>
          {bytesFormatter(transferred)} / {bytesFormatter(total)}
        </p>
      </div>
    </Dialog>
  )
}

interface GeneralSettingProps {
  updater: State.AppUpdater
}

const GeneralSetting = ({ updater }: GeneralSettingProps) => {
  const [t, i18n] = useTranslation()
  const [showLangDialog, setShowLangDialog] = useState(false)
  const [searchParams] = useSearchParams()
  const [dialogType, setDialogType] = useState<'' | 'error' | 'checking' | 'updating' | 'updated'>('')

  const version = useMemo(() => {
    return getVersion()
  }, [])

  useEffect(() => {
    const checkUpdate = searchParams.get('checkUpdate')
    if (checkUpdate === '1') {
      checkForUpdates()
    }
  }, [searchParams, checkForUpdates])

  useEffect(() => {
    if (updater.errorMsg) {
      setDialogType('error')
      return
    }
    if (updater.isUpdated) {
      setDialogType('updated')
      return
    }
    if (updater.checking) {
      setDialogType('checking')
      return
    }
    if (updater.version || updater.downloadProgress > 0) {
      setDialogType('updating')
      return
    }
    setDialogType('')
  }, [updater, setDialogType])

  const handleCancel = useCallback(() => {
    if (dialogType === 'checking') {
      cancelCheckUpdates()
    }
    setDialogType('')
  }, [dialogType, setDialogType])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p>
          {t('settings.general.version')} v{version}
        </p>
        <button type="button" onClick={() => checkForUpdates()}>
          {t(`updates.check-updates`)} <ArrowNext />
        </button>
      </div>

      <div className={styles.content}>
        <p>{t('settings.general.language')}</p>
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

      <AlertDialog
        show={dialogType === 'error'}
        title={t(`updates.check-updates`)}
        message={updater.errorMsg}
        type="failed"
        onCancel={() => setDialogType('')}
      />

      <Dialog
        show={['checking', 'updated'].includes(dialogType)}
        showCancel={false}
        showHeader={false}
        confirmText={t(dialogType === 'checking' ? 'common.cancel' : 'common.ok')}
        onConfirm={handleCancel}
        className={styles.confirmDialog}
      >
        <div className={styles.wrap}>
          <VersionLogo />
          <p>{t(dialogType === 'checking' ? 'updates.checking-updates' : 'updates.update-not-available')}</p>
        </div>
      </Dialog>

      <UpdateDownloadStatus
        show={dialogType === 'updating'}
        onCancel={() => {
          cancelDownloadUpdate()
          setDialogType('')
        }}
        progress={updater.downloadProgress}
        progressInfo={updater.progressInfo}
        newVersion={updater.version}
        releaseDate={updater.releaseDate}
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
