import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Dialog from 'widgets/Dialog'
import LanguageDialog from 'components/LanguageDialog'
import AlertDialog from 'widgets/AlertDialog'
import { ReactComponent as VersionLogo } from 'widgets/Icons/VersionLogo.svg'
import { ReactComponent as ArrowNext } from 'widgets/Icons/ArrowNext.svg'
import { ReactComponent as Update } from 'widgets/Icons/Update.svg'
import { cancelCheckUpdates, downloadUpdate, installUpdate, getVersion } from 'services/remote'
import { uniformTimeFormatter, bytesFormatter, clsx, wakeScreen, releaseWakeLock } from 'utils'
import Switch from 'widgets/Switch'
import { keepScreenAwake } from 'services/localCache'
import { LanguageSelect, UnLock } from 'widgets/Icons/icon'
import styles from './generalSetting.module.scss'
import { useCheckUpdate, useUpdateDownloadStatus } from './hooks'
import LockWindowDialog from './LockWindowDialog'

interface UpdateDownloadStatusProps {
  show: boolean
  onCancel: () => void
  progress: number
  newVersion: string
  releaseNotes: string
  progressInfo: null | State.ProgressInfo
}

const UpdateDownloadStatus = ({
  show,
  onCancel,
  progress = 0,
  newVersion = '',
  releaseNotes = '',
  progressInfo,
}: UpdateDownloadStatusProps) => {
  const [t] = useTranslation()
  const available = newVersion !== '' && progress < 0
  const downloaded = progress >= 1
  const [publishedAt, setPublishedAt] = useState('')

  const handleConfirm = useCallback(
    (e: React.FormEvent) => {
      const {
        dataset: { method },
      } = e.target as HTMLFormElement

      if (method === 'download') {
        downloadUpdate()
      } else if (method === 'install') {
        installUpdate()
      }
    },
    [downloadUpdate, installUpdate]
  )

  useEffect(() => {
    if (available) {
      fetch(`https://api.github.com/repos/nervosnetwork/neuron/releases/tags/v${newVersion}`)
        .then(async res => {
          // eslint-disable-next-line camelcase
          const { published_at } = await res.json()
          setPublishedAt(published_at)
        })
        .catch(() => {})
    }
  }, [available, setPublishedAt])

  if (available) {
    const releaseNotesHtml = () => {
      return { __html: releaseNotes }
    }

    /* eslint-disable react/no-danger */

    return (
      <Dialog
        show={show}
        onConfirm={handleConfirm}
        disabled={!available}
        confirmText={t('updates.install-update')}
        onCancel={onCancel}
        title={t('updates.update-available')}
        confirmProps={{
          'data-method': 'download',
        }}
      >
        <div className={styles.install}>
          <p className={styles.title}>
            {newVersion} {publishedAt ? `(${uniformTimeFormatter(new Date(publishedAt)).split(' ')[0]})` : null}
          </p>
          <div className={styles.releaseNotesStyle}>
            <div dangerouslySetInnerHTML={releaseNotesHtml()} />
          </div>
        </div>
      </Dialog>
    )
  }

  if (downloaded) {
    const isWin = process.platform === 'win32'
    return (
      <Dialog
        show={show}
        onCancel={onCancel}
        showCancel={false}
        onConfirm={handleConfirm}
        disabled={!downloaded}
        confirmText={t(`updates.${isWin ? 'quit-and-install' : 'quit-and-install-restart'}`)}
        title={t('updates.update-available')}
        confirmProps={{
          'data-method': 'install',
        }}
      >
        <div className={styles.install}>
          <div>{t('updates.updates-downloaded-about-to-quit-and-install')}</div>
        </div>
      </Dialog>
    )
  }

  if (progressInfo) {
    const { total, transferred } = progressInfo
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

  return null
}

interface GeneralSettingProps {
  updater: State.AppUpdater
  app: State.App
}

const GeneralSetting = ({ updater, app }: GeneralSettingProps) => {
  const [t, i18n] = useTranslation()
  const [showLangDialog, setShowLangDialog] = useState(false)
  const [isLockDialogShow, setIsLockDialogShow] = useState(false)
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState('')
  const { showCheckDialog, setShowCheckDialog, onCancelCheckUpdates } = useCheckUpdate()
  const { version: newVersion, checking, downloadProgress } = updater
  const { showUpdateDownloadStatus, openShowUpdateDownloadStatus, onCheckUpdate, onCancel } = useUpdateDownloadStatus({
    setShowCheckDialog,
    downloadProgress,
  })

  useEffect(() => {
    if (showCheckDialog && newVersion) {
      setShowCheckDialog(false)
      openShowUpdateDownloadStatus()
    }
  }, [showCheckDialog, newVersion, openShowUpdateDownloadStatus, setShowCheckDialog])

  const currentVersion = useMemo(() => {
    return getVersion()
  }, [])

  useEffect(() => {
    const checkUpdate = searchParams.get('checkUpdate')
    if (checkUpdate === '1') {
      onCheckUpdate()
    }
  }, [searchParams, onCheckUpdate])

  useEffect(() => {
    if (updater.errorMsg) {
      setErrorMsg(updater.errorMsg)
      cancelCheckUpdates()
    }
  }, [updater.errorMsg, setErrorMsg])

  const [isScreenKeepAwake, setIsScreenKeepAwake] = useState(keepScreenAwake.get())
  const onChangeScreenKeepAwake = useCallback((v: boolean) => {
    keepScreenAwake.save(v)
    setIsScreenKeepAwake(v)
    if (v) {
      wakeScreen()
    } else {
      releaseWakeLock()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={clsx(styles.content, `${newVersion ? styles.showVersion : ''}`)} data-new-version-tip="New">
        <p>
          {t('settings.general.version')} v{newVersion || currentVersion}
        </p>
        <button
          type="button"
          data-button-type="text"
          onClick={newVersion ? openShowUpdateDownloadStatus : onCheckUpdate}
          data-method="check"
        >
          <Update />
          {t(newVersion ? 'updates.install-update' : 'updates.check-updates')} <ArrowNext />
        </button>
      </div>

      <div className={styles.content}>
        <p>{t('settings.general.language')}</p>
        <button
          type="button"
          data-button-type="text"
          onClick={() => {
            setShowLangDialog(true)
          }}
        >
          <LanguageSelect />
          {t(`settings.locale.${i18n.language}`)}
        </button>
      </div>
      <div className={clsx(styles.content, styles.lockWindow)}>
        <p>{t('settings.general.keep-awake')}</p>
        <Switch checked={isScreenKeepAwake} onChange={onChangeScreenKeepAwake} />
      </div>

      <div className={clsx(styles.content, styles.lockWindow)}>
        <p>{t('settings.general.lock-password')}</p>
        <button
          type="button"
          data-button-type="text"
          onClick={() => {
            setIsLockDialogShow(true)
          }}
        >
          <UnLock />
          {t(
            `settings.general.${app.lockWindowInfo?.encryptedPassword ? 'change-lock-password' : 'set-lock-password'}`
          )}
        </button>
      </div>

      <AlertDialog
        show={!!errorMsg}
        title={t(`updates.check-updates`)}
        message={errorMsg}
        type="failed"
        onCancel={() => {
          setErrorMsg('')
        }}
      />

      <Dialog
        show={showCheckDialog}
        showCancel={false}
        showHeader={false}
        confirmText={t(checking ? 'common.cancel' : 'common.ok')}
        onConfirm={onCancelCheckUpdates}
        className={styles.confirmDialog}
      >
        <div className={styles.wrap}>
          <VersionLogo />
          <p>{t(checking || newVersion ? 'updates.checking-updates' : 'updates.update-not-available')}</p>
        </div>
      </Dialog>

      <UpdateDownloadStatus
        show={showUpdateDownloadStatus}
        onCancel={onCancel}
        progress={updater.downloadProgress}
        progressInfo={updater.progressInfo}
        newVersion={updater.version}
        releaseNotes={updater.releaseNotes}
      />

      <LanguageDialog
        show={showLangDialog}
        close={() => {
          setShowLangDialog(false)
        }}
      />

      <LockWindowDialog
        show={isLockDialogShow}
        encryptedPassword={app.lockWindowInfo?.encryptedPassword}
        onCancel={() => {
          setIsLockDialogShow(false)
        }}
      />
    </div>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
