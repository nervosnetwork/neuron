import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, useRoutes, RouteObject } from 'react-router-dom'

import 'theme'
import 'styles/theme.scss'
import 'styles/index.scss'
import 'utils/i18n'

import ErrorBoundary from 'components/ErrorBoundary'
import Spinner from 'widgets/Spinner'
import { withProvider } from 'states'
import mainRouterConfig from 'router'

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

export default undefined
