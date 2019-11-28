import React, { useContext, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner, Text, ProgressIndicator } from 'office-ui-fabric-react'
import { NeuronWalletContext } from 'states/stateProvider'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { addPopup } from 'states/stateProvider/actionCreators'
import { checkForUpdates, downloadUpdate, installUpdate, clearCellCache } from 'services/remote'
import { releaseNotesStyle } from './style.module.scss'

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
        <div className={releaseNotesStyle}>
          <div dangerouslySetInnerHTML={releaseNotesHtml()} />
        </div>
        <Stack horizontal horizontalAlign="start">
          <PrimaryButton
            onClick={download}
            disabled={!available}
            styles={{
              root: {
                minWidth: 180,
              },
            }}
          >
            {t('updates.download-update')}
          </PrimaryButton>
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
          <PrimaryButton
            onClick={quitAndInstall}
            disabled={!downloaded}
            styles={{
              root: {
                minWidth: 180,
              },
            }}
          >
            {t('updates.quit-and-install')}
          </PrimaryButton>
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
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack>
        <Stack horizontal horizontalAlign="start">
          {updater.version !== '' || updater.downloadProgress >= 0 ? (
            <UpdateDownloadStatus
              progress={updater.downloadProgress}
              newVersion={updater.version}
              releaseNotes={updater.releaseNotes}
            />
          ) : (
            <PrimaryButton
              onClick={checkUpdates}
              disabled={updater.checking}
              ariaDescription="Check updates"
              styles={{
                root: {
                  minWidth: 180,
                },
              }}
            >
              {updater.checking ? <Spinner /> : t('updates.check-updates')}
            </PrimaryButton>
          )}
        </Stack>
      </Stack>

      <Stack>
        <Text as="p" variant="medium">
          {t('settings.general.clear-cache-description')}
        </Text>
        <Stack horizontal horizontalAlign="start">
          <PrimaryButton
            onClick={clearCache}
            disabled={clearingCache}
            ariaDescription="Clear cache"
            styles={{
              root: {
                minWidth: 180,
              },
            }}
          >
            {clearingCache ? <Spinner /> : t('settings.general.clear-cache')}
          </PrimaryButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
