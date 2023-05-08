import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, useRoutes, RouteObject } from 'react-router-dom'

import 'theme'
import 'styles/theme.scss'
import 'styles/index.scss'
import 'utils/i18n'

import Transaction from 'components/Transaction'
import MultiSignAddress from 'components/MultisigAddress'
import ErrorBoundary from 'components/ErrorBoundary'
import Spinner from 'widgets/Spinner'
import { withProvider } from 'states'
import mainRouterConfig from 'router'

if (window.location.hash.startsWith('#/transaction/')) {
  ReactDOM.render(<Transaction />, document.getElementById('root'))
} else if (window.location.hash.startsWith('#/multisig-address/')) {
  ReactDOM.render(
    <Router>
      <MultiSignAddress />
    </Router>,
    document.getElementById('root')
  )
} else {
  window.neuron = {
    role: 'main',
  }

  const containers: RouteObject[] = mainRouterConfig

  const RouterRender = () => useRoutes(containers)

  const App = withProvider(() => {
    return (
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Router>
            <RouterRender />
          </Router>
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
