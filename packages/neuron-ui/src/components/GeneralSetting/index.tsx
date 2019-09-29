import React, { useMemo } from 'react'
import { Stack, Toggle } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { toggleAddressBook, setSkipDataAndType } from 'states/stateProvider/actionCreators'

const GeneralSetting = ({
  settings: {
    general: { showAddressBook, skipDataAndType },
  },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const [onToggleAddressVisibility, onSetSkipDataAndType] = useMemo(
    () => [() => dispatch(toggleAddressBook()), () => setSkipDataAndType(!skipDataAndType)(dispatch)],
    [dispatch, skipDataAndType]
  )
  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Toggle
        checked={showAddressBook}
        label={t('settings.general.display-address-book-in-the-navbar')}
        onText={t('common.toggle.on')}
        offText={t('common.toggle.off')}
        onChange={onToggleAddressVisibility}
      />
      <Toggle
        checked={skipDataAndType}
        label={t('settings.general.skip-data-and-type')}
        onText={t('common.toggle.on')}
        offText={t('common.toggle.off')}
        onChange={onSetSkipDataAndType}
      />
    </Stack>
  )
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
