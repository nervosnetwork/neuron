import React from 'react'
import withProviders from '../../containers/Providers'
import I18nProvider from '../../containers/I18nProvider'

import Router from '../Router'

const App = () => (
  <I18nProvider>
    <Router />
  </I18nProvider>
)

export default withProviders(App)
