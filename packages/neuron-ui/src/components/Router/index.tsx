import React from 'react'
import { HashRouter as Router } from 'react-router-dom'
import { createHashHistory } from 'history'

import Header from 'containers/Header'
import Sidebar from 'containers/Sidebar'
import MainContent from 'containers/MainContent'
import Notification from 'containers/Notification'
import Footer from 'containers/Footer'
import WalletWizard from 'components/WalletWizard'
import WalletDetail from 'components/WalletDetail'
import Send from 'components/Transfer'
import Receive from 'components/Receive'
import History from 'components/History'
import Transaction from 'components/Transaction'
import Settings from 'components/Settings'
import GeneralSetting from 'components/GeneralSetting'
import Addresses from 'components/Addresses'
import Wallets from 'components/WalletSetting'
import NetworkSetting from 'components/NetworkSetting'
import NetworkEditor from 'components/NetworkEditor'
import WalletEditor from 'components/WalletEditor'
import Prompt from 'components/Prompt'
import LaunchScreen from 'components/LaunchScreen'

import { Routes } from 'utils/const'
import RoutesWithProps from './RoutesWithProps'

export interface CustomRoute {
  name: string
  path: string
  params?: string
  exact?: boolean
  component: React.FunctionComponent<any>
}

export const history = createHashHistory()
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
    name: 'Footer',
    path: '/',
    exact: false,
    component: Footer,
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
    name: 'launch',
    path: Routes.Launch,
    exact: true,
    component: LaunchScreen,
  },
  {
    name: `Wallet`,
    path: Routes.Wallet,
    exact: false,
    params: `/:id?`,
    component: WalletDetail,
  },
  {
    name: `Send`,
    path: Routes.Send,
    params: `/:address?`,
    exact: false,
    component: Send,
  },
  {
    name: `Receive`,
    path: Routes.Receive,
    params: `/:address?`,
    exact: false,
    component: Receive,
  },
  {
    name: `History`,
    path: Routes.History,
    exact: false,
    component: History,
  },
  {
    name: `Transaction`,
    path: Routes.Transaction,
    params: `/:hash`,
    exact: false,
    component: Transaction,
  },
  {
    name: `Addresses`,
    path: Routes.Addresses,
    exact: false,
    component: Addresses,
  },
  {
    name: `Settings`,
    path: Routes.Settings,
    exact: false,
    component: Settings,
  },
  {
    name: `GeneralSetting`,
    path: Routes.SettingsGeneral,
    exact: false,
    component: GeneralSetting,
  },
  {
    name: `SettingsWallets`,
    path: Routes.SettingsWallets,
    exact: false,
    component: Wallets,
  },
  {
    name: `NetworkSetting`,
    path: Routes.SettingsNetworks,
    exact: true,
    component: NetworkSetting,
  },
  {
    name: `NetorkEditor`,
    path: Routes.NetworkEditor,
    params: '/:id',
    exact: false,
    component: NetworkEditor,
  },
  {
    name: `WalletEditor`,
    path: Routes.WalletEditor,
    params: '/:id',
    exact: true,
    component: WalletEditor,
  },
  {
    name: `WalletWizard`,
    path: Routes.WalletWizard,
    exact: false,
    component: WalletWizard,
  },
  {
    name: `Prompt`,
    path: Routes.Prompt,
    params: '/:event',
    exact: false,
    component: Prompt,
  },
]

const CustomRouter = (appProps: any) => {
  return (
    <Router>
      <RoutesWithProps contents={containers} />
      <MainContent {...appProps}>
        <RoutesWithProps contents={mainContents} />
      </MainContent>
    </Router>
  )
}

CustomRouter.displayName = 'CustomRouter'

export default CustomRouter
