import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route } from 'react-router-dom'
import { loadTheme } from 'office-ui-fabric-react'

import 'styles/index.scss'
import 'utils/i18n'
import * as serviceWorker from 'serviceWorker'

import Navbar from 'containers/Navbar'
import Notification from 'containers/Notification'
import Main from 'containers/Main'
import Footer from 'containers/Footer'
import ErrorBoundary from 'components/ErrorBoundary'
import withProviders from 'states/stateProvider'

loadTheme({
  fonts: {
    tiny: { fontSize: '11px' },
    xSmall: { fontSize: '12px' },
    small: { fontSize: '14px' },
    smallPlus: { fontSize: '15px' },
    medium: { fontSize: '16px' },
    mediumPlus: { fontSize: '17px' },
    large: { fontSize: '18px' },
    xLarge: { fontSize: '22px' },
    xxLarge: { fontSize: '28px' },
    superLarge: { fontSize: '42px' },
    mega: { fontSize: '72px' },
  },
})

export const containers: CustomRouter.Route[] = [
  {
    name: 'Navbar',
    path: '/',
    exact: false,
    comp: Navbar,
  },
  {
    name: 'Main',
    path: '/',
    exact: false,
    comp: Main,
  },
  {
    name: 'Footer',
    path: '/',
    exact: false,
    comp: Footer,
  },
  {
    name: 'Notification',
    path: '/',
    exact: false,
    comp: Notification,
  },
]

const App = withProviders(({ dispatch }: any) => (
  <Router>
    {containers.map(container => {
      return (
        <Route
          {...container}
          key={container.name}
          render={routeProps => (
            <ErrorBoundary>
              <container.comp {...routeProps} dispatch={dispatch} />
            </ErrorBoundary>
          )}
        />
      )
    })}
  </Router>
))

Object.defineProperty(App, 'displayName', {
  value: 'App',
})

ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.register()

export default undefined
