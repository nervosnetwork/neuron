import React, { useContext, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Text, ProgressIndicator } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { NeuronWalletContext } from 'states/stateProvider'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { addPopup } from 'states/stateProvider/actionCreators'
import { checkForUpdates, downloadUpdate, installUpdate, clearCellCache } from 'services/remote'
import styles from './style.module.scss'

const UpdateDownloadStatus = ({
  progress = 0,
  newVersion = '',
  releaseNotes = '',
}: React.PropsWithoutRef<{ progress: number; newVersion: string; releaseNotes: string }>) => {
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
      <Stack>
        <Text as="p" variant="medium">
          {t('updates.updates-found-do-you-want-to-update', { version: newVersion })}
        </Text>
        <h3>{t('updates.release-notes')}</h3>
        <div className={styles.releaseNotesStyle}>
          <div dangerouslySetInnerHTML={releaseNotesHtml()} />
        </div>
        <Stack horizontal horizontalAlign="start">
          <Button
            type="primary"
            onClick={download}
            disabled={!available}
            label={t('updates.download-update')}
            style={{ minWidth: '180px' }}
          />
        </Stack>
      </Stack>
    )
  }

  if (downloaded) {
    const quitAndInstall = () => {
      installUpdate()
    }

    return (
      <Stack>
        <Text as="p" variant="medium">
          {t('updates.updates-downloaded-about-to-quit-and-install')}
        </Text>
        <Stack horizontal horizontalAlign="start">
          <Button
            type="primary"
            onClick={quitAndInstall}
            disabled={!downloaded}
            style={{ minWidth: '180px' }}
            label={t('updates.quit-and-install')}
          />
        </Stack>
      </Stack>
    )
  }

  return (
    <ProgressIndicator
      percentComplete={progress}
      label={t('updates.downloading-update')}
      styles={{ root: { width: '250px' } }}
    />
  )
}

const GeneralSetting = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const { updater } = useContext(NeuronWalletContext)
  const [clearingCache, setClearingCache] = useState(false)

  const checkUpdates = useCallback(() => {
    checkForUpdates()
  }, [])

  const clearCache = useCallback(() => {
    setClearingCache(true)
    setTimeout(() => {
      clearCellCache().finally(() => {
        addPopup('clear-cache-successfully')(dispatch)
        setClearingCache(false)
      })
    }, 100)
  }, [dispatch])

  return (
    <Stack tokens={{ childrenGap: 25 }} className={styles.container}>
      <Stack>
        <Stack horizontal horizontalAlign="start">
          {updater.version !== '' || updater.downloadProgress >= 0 ? (
            <UpdateDownloadStatus
              progress={updater.downloadProgress}
              newVersion={updater.version}
              releaseNotes={updater.releaseNotes}
            />
          ) : (
            <Button
              label={t('updates.check-updates')}
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
          )}
        </Stack>
      </Stack>

      <Stack>
        <Text as="p" variant="medium">
          {t('settings.general.clear-cache-description')}
        </Text>
        <Stack horizontal horizontalAlign="start">
          <Button
            type="default"
            label={t('settings.general-clear-cache')}
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
        </Stack>
      </Stack>
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
