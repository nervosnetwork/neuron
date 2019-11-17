import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner } from 'office-ui-fabric-react'
import { StateWithDispatch, AppActions } from 'states/stateProvider/reducer'
import { clearCellCache } from 'services/remote'

const GeneralSetting = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const [clearing, setClearing] = useState(false)

  const clearCache = useCallback(() => {
    // TODO: real clear action
    setClearing(true)
    setTimeout(() => {
      clearCellCache()
        .catch(err => {
          dispatch({
            type: AppActions.AddNotification,
            payload: {
              type: 'alert',
              timestamp: +new Date(),
              content: err.message,
            },
          })
        })
        .finally(() => {
          setClearing(false)
        })
    }, 1000)
  }, [dispatch])

  return (
    <Stack tokens={{ childrenGap: 15 }} horizontal horizontalAlign="start">
      <PrimaryButton
        onClick={clearCache}
        disabled={clearing}
        ariaDescription="Create new network configuration"
        styles={{
          root: {
            minWidth: 150,
          },
        }}
      >
        {clearing ? <Spinner /> : t('settings.general.clear-cache')}
      </PrimaryButton>
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
