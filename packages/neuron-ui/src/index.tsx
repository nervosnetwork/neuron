import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'

import 'theme'
import 'styles/theme.scss'
import 'styles/index.scss'
import 'utils/i18n'
import { useRoutes } from 'utils'

import Navbar from 'containers/Navbar'
import Main from 'containers/Main'
import Transaction from 'components/Transaction'
import SignAndVerify from 'components/SignAndVerify'
import MultiSignAddress from 'components/MultisigAddress'
import ErrorBoundary from 'components/ErrorBoundary'
import Spinner from 'widgets/Spinner'
import { withProvider } from 'states'

const Notification = lazy(() => import('containers/Notification'))
const Settings = lazy(() => import('containers/Settings'))

if (window.location.hash.startsWith('#/transaction/')) {
  ReactDOM.render(<Transaction />, document.getElementById('root'))
} else if (window.location.hash.startsWith('#/sign-verify/')) {
  ReactDOM.render(<SignAndVerify />, document.getElementById('root'))
} else if (window.location.hash.startsWith('#/multisig-address/')) {
  ReactDOM.render(
    <Router>
      <MultiSignAddress />
    </Router>,
    document.getElementById('root')
  )
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
        <Suspense fallback={<Spinner />}>
          <Router>{routes}</Router>
        </Suspense>
      </ErrorBoundary>
    )
  })

  Object.defineProperty(App, 'displayName', {
    value: 'App',
  })
  ReactDOM.render(<App />, document.getElementById('root'))
}

export default undefined
