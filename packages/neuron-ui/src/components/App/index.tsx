import React from 'react'
import withProviders from '../../containers/Providers'
import Router from '../Router'

const App = (props: any) => <Router {...props} />

export default withProviders(App)
