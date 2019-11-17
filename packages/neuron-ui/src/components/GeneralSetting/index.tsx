import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner } from 'office-ui-fabric-react'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { addPopup } from 'states/stateProvider/actionCreators'
import { clearCellCache } from 'services/remote'

const GeneralSetting = ({ dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const [clearing, setClearing] = useState(false)

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
