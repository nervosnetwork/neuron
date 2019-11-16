import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, Spinner } from 'office-ui-fabric-react'

const GeneralSetting = () => {
  const [t] = useTranslation()
  const [clearing, setClearing] = useState(false)

  const clearCache = useCallback(() => {
    // TODO: real clear action
    setClearing(true)
    setTimeout(() => {
      setClearing(false)
    }, 2000)
  }, [])

  return (
    <Stack tokens={{ childrenGap: 15 }} horizontal horizontalAlign="start">
      <PrimaryButton
        text={t('settings.general.clear-cache')}
        onClick={clearCache}
        disabled={clearing}
        ariaDescription="Create new network configuration"
      />
      {clearing ? <Spinner /> : null}
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
