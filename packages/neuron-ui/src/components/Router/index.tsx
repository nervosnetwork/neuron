import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Routes } from '../../utils/const'
import MainContent from '../../containers/MainContent'
import Notification from '../../containers/Notification'
import Sidebar from '../../containers/Sidebar'
import Header from '../../containers/Header'
import Home from '../Home'
import WalletDetail from '../WalletDetail'
import Send from '../Transfer'
import Receive from '../Receive'
import History from '../History'
import Addresses from '../Addresses'
import Settings from '../Settings'
import WalletWizard, { ImportWallet, CreateWallet } from '../WalletWizard'
import General from '../Settings/General'
import Wallets from '../Settings/Wallets'
import Network from '../Settings/Network'

interface CustomRoute {
  path: string
  name: string
  exact?: boolean
  component: React.ComponentType
}

export const containers: CustomRoute[] = [
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
    name: 'Home',
    path: Routes.Home,
    exact: true,
    component: Home,
  },
  {
    name: 'Wallet',
    path: Routes.Wallet,
    exact: false,
    component: WalletDetail,
  },
  {
    name: 'Send',
    path: Routes.Send,
    exact: false,
    component: Send,
  },
  {
    name: 'Receive',
    path: Routes.Receive,
    exact: false,
    component: Receive,
  },
  {
    name: 'History',
    path: Routes.History,
    exact: false,
    component: History,
  },
  {
    name: 'Addresses',
    path: Routes.Addresses,
    exact: false,
    component: Addresses,
  },
  {
    name: 'Settings',
    path: Routes.Settings,
    exact: false,
    component: Settings,
  },
  {
    name: 'SettingsGeneral',
    path: Routes.SettingsGeneral,
    exact: false,
    component: General,
  },
  {
    name: 'SettingsWallets',
    path: Routes.SettingsWallets,
    exact: false,
    component: Wallets,
  },
  {
    name: 'SettingsNetwork',
    path: Routes.SettingsNetwork,
    exact: false,
    component: Network,
  },
  {
    name: 'CreateWallet',
    path: Routes.CreateWallet,
    exact: false,
    component: CreateWallet,
  },
  {
    name: 'ImportWallet',
    path: Routes.ImportWallet,
    exact: false,
    component: ImportWallet,
  },
  {
    name: 'WalletWizard',
    path: Routes.WalletWizard,
    exact: false,
    component: WalletWizard,
  },
]

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
