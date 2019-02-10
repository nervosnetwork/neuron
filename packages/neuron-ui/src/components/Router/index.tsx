import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Notification from '../Notification'
import Sidebar from '../Sidebar'
import Header from '../Header'
// import Transfer from '../Transfer'
// import Cells from '../Cells'
import Send from '../Send'
import Receive from '../Receive'
import History from '../History'
import Addresses from '../Addresses'
import Settings from '../Settings'

interface CustomRoute {
  path: string
  name: string
  showInSidebar?: boolean
  exact?: boolean
  component: React.ComponentType
}

export const routes: CustomRoute[] = [
  {
    name: 'Header',
    showInSidebar: false,
    path: '/',
    exact: false,
    component: Header,
  },
  {
    name: 'Sidebar',
    showInSidebar: false,
    path: '/',
    exact: false,
    component: Sidebar,
  },
  {
    name: 'Send',
    showInSidebar: true,
    path: '/send',
    exact: false,
    component: Send,
  },
  {
    name: 'Receive',
    showInSidebar: true,
    path: '/receive',
    exact: false,
    component: Receive,
  },
  {
    name: 'History',
    showInSidebar: true,
    path: '/history',
    exact: false,
    component: History,
  },
  {
    name: 'Addresses',
    showInSidebar: true,
    path: '/addresses',
    exact: false,
    component: Addresses,
  },
  {
    name: 'Settings',
    showInSidebar: true,
    path: '/settings',
    exact: false,
    component: Settings,
  },
  {
    name: 'Notification',
    showInSidebar: false,
    path: '/',
    exact: false,
    component: Notification,
  },
]

export default () => (
  <Router>
    <>
      {routes.map(route => (
        <Route key={route.name} {...route} />
      ))}
    </>
  </Router>
)
