import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import {
  Icon,
  CreditCard as IconWallet,
  Upload as IconSend,
  Download as IconReceive,
  History as IconHistory,
  Database as IconAddresses,
  Performance as IconSettings,
} from 'grommet-icons'
import MainContent from '../../containers/MainContent'
import Notification from '../../containers/Notification'
import Sidebar from '../../containers/Sidebar'
import Header from '../../containers/Header'
// import Transfer from '../Transfer'
// import Cells from '../Cells'
import CurrentWallet from '../CurrentWallet'
import Send from '../Send'
import Receive from '../Receive'
import History from '../History'
import Addresses from '../Addresses'
import Settings from '../Settings'
import SettingsImport from '../Settings/importWallet'
import SettingsCreate from '../Settings/createWallet'
import Modal from '../Modal'

interface CustomRoute {
  path: string
  name: string
  icon?: Icon
  exact?: boolean
  component: React.ComponentType
}

export const containers: CustomRoute[] = [
  {
    name: 'Modal',
    path: '/',
    exact: false,
    component: Modal,
  },
  {
    name: 'Header',
    path: '/',
    exact: false,
    component: Header,
  },
  {
    name: 'Sidebar',
    path: '/',
    exact: false,
    component: Sidebar,
  },
  {
    name: 'Notification',
    path: '/',
    exact: false,
    component: Notification,
  },
]

export const mainContents: CustomRoute[] = [
  {
    name: 'Wallet',
    icon: IconWallet,
    path: '/wallet',
    exact: false,
    component: CurrentWallet,
  },
  {
    name: 'Send',
    icon: IconSend,
    path: '/send',
    exact: false,
    component: Send,
  },
  {
    name: 'Receive',
    icon: IconReceive,
    path: '/receive',
    exact: false,
    component: Receive,
  },
  {
    name: 'History',
    icon: IconHistory,
    path: '/history',
    exact: false,
    component: History,
  },
  {
    name: 'Addresses',
    icon: IconAddresses,
    path: '/addresses',
    exact: false,
    component: Addresses,
  },
  {
    name: 'Settings',
    icon: IconSettings,
    path: '/settings',
    exact: false,
    component: Settings,
  },
  {
    name: 'SettingsCreate',
    path: '/settings/createWallet',
    exact: false,
    component: SettingsCreate,
  },
  {
    name: 'SettingsImport',
    path: '/settings/importWallet',
    exact: false,
    component: SettingsImport,
  },
]

const sidebarRouteNames = ['Wallet', 'Send', 'Receive', 'History', 'Addresses', 'Settings']
export const sidebarRoutes: CustomRoute[] = sidebarRouteNames.map(name => {
  const entry = mainContents.find(route => route.name === name)!
  return entry
})

const renderComp = (route: CustomRoute) => <Route key={route.name} {...route} />

const CustomRouter = () => (
  <Router>
    <>
      {containers.map(renderComp)}
      <MainContent>
        <>{mainContents.map(renderComp)}</>
      </MainContent>
    </>
  </Router>
)

CustomRouter.displayName = 'CustomRouter'

export default CustomRouter
