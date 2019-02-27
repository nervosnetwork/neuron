import React, { useContext } from 'react'

import { IntlProvider, addLocaleData } from 'react-intl'

import enLocaleData from 'react-intl/locale-data/en'
import zhLocaleData from 'react-intl/locale-data/zh'
import SettingsContext from '../../contexts/Settings'

import i18nObjects from '../../locale'

addLocaleData(enLocaleData)
addLocaleData(zhLocaleData)

const Providers = ({ children }: { children: any }) => {
  const settingsContext = useContext(SettingsContext)
  return (
    <IntlProvider locale={settingsContext.language} messages={i18nObjects[settingsContext.language]}>
      {children}
    </IntlProvider>
  )
}

export default Providers
