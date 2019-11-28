import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner, Text, ProgressIndicator } from 'office-ui-fabric-react'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { addPopup } from 'states/stateProvider/actionCreators'
import { checkForUpdates, downloadUpdate, installUpdate, clearCellCache } from 'services/remote'

const UpdateDownloadStatus = ({
  progress = 0,
  newVersion = '',
}: React.PropsWithoutRef<{ progress: number; newVersion: string }>) => {
  const [t] = useTranslation()
  const available = newVersion !== '' && progress <= 0
  const downloaded = progress >= 1

  if (available) {
    const download = () => {
      downloadUpdate()
    }

    return (
      <Stack>
        <Text as="p" variant="medium">
          {t('updates.updates-found-do-you-want-to-update', { version: newVersion })}
        </Text>
        <Stack horizontal horizontalAlign="start">
          <PrimaryButton
            onClick={download}
            disabled={available}
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
  const [clearing, setClearing] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false) // TODO: checkingUpdates should be fetched from backend
  const [downloadingUpdate] = useState(false)

  const checkUpdates = useCallback(() => {
    setCheckingUpdates(true)
    setTimeout(() => {
      checkForUpdates()
    }, 100)
  }, [dispatch])

  const clearCache = useCallback(() => {
    setClearing(true)
    setTimeout(() => {
      clearCellCache().finally(() => {
        addPopup('clear-cache-successfully')(dispatch)
        setClearing(false)
      })
    }, 100)
  }, [dispatch])

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack>
        <Stack horizontal horizontalAlign="start">
          {downloadingUpdate ? (
            <UpdateDownloadStatus progress={1} newVersion="v0.25.2" />
          ) : (
            <PrimaryButton
              onClick={checkUpdates}
              disabled={checkingUpdates}
              ariaDescription="Check updates"
              styles={{
                root: {
                  minWidth: 180,
                },
              }}
            >
              {checkingUpdates ? <Spinner /> : t('updates.check-updates')}
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
            disabled={clearing}
            ariaDescription="Clear cache"
            styles={{
              root: {
                minWidth: 180,
              },
            }}
          >
            {clearing ? <Spinner /> : t('settings.general.clear-cache')}
          </PrimaryButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
