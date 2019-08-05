import React, { useCallback } from 'react'
import { Stack, Toggle } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { toggleAddressBook } from 'states/stateProvider/actionCreators'

const GeneralSetting = ({ settings: { showAddressBook }, dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const onToggle = useCallback(() => {
    dispatch(toggleAddressBook())
  }, [dispatch])
  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Toggle
        checked={showAddressBook}
        label={t('settings.general.display-address-book-in-the-navbar')}
        onText={t('common.toggle.on')}
        offText={t('common.toggle.off')}
        onChange={onToggle}
      />
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
