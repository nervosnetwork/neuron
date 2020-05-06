import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route } from 'react-router-dom'

import 'theme'
import 'styles/index.scss'
import 'utils/i18n'

import Navbar from 'containers/Navbar'
import Notification from 'containers/Notification'
import Main from 'containers/Main'
import Transaction from 'components/Transaction'
import SignAndVerify from 'components/SignAndVerify'
import ErrorBoundary from 'components/ErrorBoundary'
import { withProvider } from 'states'

export const containers: CustomRouter.Route[] = [
  {
    name: 'Navbar',
    path: '/',
    exact: false,
    component: Navbar,
  },
  {
    name: 'Main',
    path: '/',
    exact: false,
    component: Main,
  },
  {
    name: 'Notification',
    path: '/',
    exact: false,
    component: Notification,
  },
]

const App = withProvider(() => (
  <ErrorBoundary>
    <Router>
      {containers.map(container => {
        return <Route {...container} key={container.name} />
      })}
    </Router>
  </ErrorBoundary>
))

Object.defineProperty(App, 'displayName', {
  value: 'App',
})

if (window.location.hash.startsWith('#/transaction/')) {
  ReactDOM.render(<Transaction />, document.getElementById('root'))
} else if (window.location.hash.startsWith('#/sign-verify/')) {
  ReactDOM.render(<SignAndVerify />, document.getElementById('root'))
} else {
  ReactDOM.render(<App />, document.getElementById('root'))
}

export default undefined
