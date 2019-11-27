import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner, Text } from 'office-ui-fabric-react'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { addPopup } from 'states/stateProvider/actionCreators'
import { checkForUpdates, clearCellCache } from 'services/remote'

const GeneralSetting = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const [clearing, setClearing] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false) // TODO: checkingUpdates should be fetched from backend

  const checkUpdates = useCallback(() => {
    setCheckingUpdates(true)
    setTimeout(() => {
      checkForUpdates().finally(() => {
        setCheckingUpdates(false)
      })
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
          <PrimaryButton
            onClick={checkUpdates}
            disabled={checkingUpdates}
            ariaDescription="Check updates"
            styles={{
              root: {
                minWidth: 150,
              },
            }}
          >
            {checkingUpdates ? <Spinner /> : t('updates.check-updates')}
          </PrimaryButton>
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
                minWidth: 150,
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
