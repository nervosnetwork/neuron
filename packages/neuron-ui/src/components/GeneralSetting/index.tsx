import React, { useCallback } from 'react'
import { Stack, Toggle } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

const GeneralSetting = ({ settings: { showAddressBook }, dispatch }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const onToggle = useCallback(() => {
    dispatch(actionCreators.toggleAddressBook())
  }, [dispatch])
  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Toggle
        inlineLabel
        checked={showAddressBook}
        label={t('settings.general.display-address-book-in-the-navbar')}
        onText={t('settings.general.show')}
        offText={t('settings.general.hide')}
        onChange={onToggle}
      />
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
