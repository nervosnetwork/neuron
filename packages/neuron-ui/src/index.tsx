import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'

import 'theme'
import 'styles/index.scss'
import 'utils/i18n'
import { useRoutes } from 'utils'

import Navbar from 'containers/Navbar'
import Notification from 'containers/Notification'
import Main from 'containers/Main'
import Settings from 'containers/Settings'
import Transaction from 'components/Transaction'
import SignAndVerify from 'components/SignAndVerify'
import ErrorBoundary from 'components/ErrorBoundary'
import { withProvider } from 'states'

if (window.location.hash.startsWith('#/transaction/')) {
  ReactDOM.render(<Transaction />, document.getElementById('root'))
} else if (window.location.hash.startsWith('#/sign-verify/')) {
  ReactDOM.render(<SignAndVerify />, document.getElementById('root'))
} else {
  const isSettings = window.location.hash.startsWith('#/settings/')

  window.neuron = {
    role: isSettings ? 'settings' : 'main',
  }

  const containers: CustomRouter.Route[] = isSettings
    ? [
        { name: 'Main', path: '/', exact: false, component: Settings },
        { name: 'Notification', path: '/', exact: false, component: Notification },
      ]
    : [
        { name: 'Navbar', path: '/', exact: false, component: Navbar },
        { name: 'Main', path: '/', exact: false, component: Main },
        { name: 'Notification', path: '/', exact: false, component: Notification },
      ]

  const App = withProvider(() => {
    const routes = useRoutes(containers)
    return (
      <ErrorBoundary>
        <Router>{routes}</Router>
      </ErrorBoundary>
    )
  })

  Object.defineProperty(App, 'displayName', {
    value: 'App',
  })

  ReactDOM.render(<App />, document.getElementById('root'))
}

export default undefined
