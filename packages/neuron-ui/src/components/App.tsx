import React from 'react'
import withProviders from './Providers'
import Notification from './Notification'
import Sidebar from './Sidebar'
import Header from './Header'
import Transfer from './Transfer'
import Cells from './Cells'

const App = () => (
  <>
    <Header />
    <Sidebar />
    <Notification />
    <>
      <Transfer />
      <Cells />
      <p>Main Content goes here</p>
    </>
  </>
)

export default withProviders(App)
