import React from 'react'
import ReactDOM from 'react-dom'
// import withProviders from 'containers/Providers'
import Router from 'components/Router'
import 'styles/index.scss'
import 'utils/i18n'
import * as serviceWorker from 'serviceWorker'

// const App = withProviders(Router)
const App = Router

ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.register()
