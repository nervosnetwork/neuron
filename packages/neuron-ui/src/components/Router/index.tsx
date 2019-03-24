import React, { useContext } from 'react'
import { BrowserRouter as Router, Route, RouteComponentProps } from 'react-router-dom'
import { Routes, Channel } from '../../utils/const'

import UILayer from '../../services/UILayer'

import RoutesWithProps from './RoutesWithProps'
import MainContent from '../../containers/MainContent'
import Notification from '../../containers/Notification'
import Sidebar from '../../containers/Sidebar'
import Header from '../../containers/Header'
import Home from '../Home'
import WalletDetail from '../WalletDetail'
import Send from '../Transfer'
import Receive from '../Receive'
import History from '../History'
import Transaction from '../Transaction'
import Addresses from '../Addresses'
import Settings from '../Settings'
import WalletWizard, { ImportWallet, CreateWallet } from '../WalletWizard'
import General from '../Settings/General'
import Wallets from '../Settings/Wallets'
import Network from '../Settings/Networks'
import NetworkEditor from '../NetworkEditor'
import WalletEditor from '../WalletEditor'
import Terminal from '../Terminal'

import WalletContext from '../../contexts/Wallet'

export interface CustomRoute {
  path: string
  name: string
  params?: string
  exact?: boolean
  component: React.FunctionComponent<any>
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
    name: `Home`,
    path: Routes.Home,
    exact: true,
    component: Home,
  },
  {
    name: `Wallet`,
    path: Routes.Wallet,
    exact: false,
    component: WalletDetail,
  },
  {
    name: `Send`,
    path: Routes.Send,
    exact: false,
    component: Send,
  },
  {
    name: `Receive`,
    path: `${Routes.Receive}/:address`,
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
    params: '/:hash',
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
    name: `SettingsGeneral`,
    path: Routes.SettingsGeneral,
    exact: false,
    component: General,
  },
  {
    name: `SettingsWallets`,
    path: Routes.SettingsWallets,
    exact: false,
    component: Wallets,
  },
  {
    name: `SettingsNetwork`,
    path: Routes.SettingsNetworks,
    exact: true,
    component: Network,
  },
  {
    name: `NetorkEditor`,
    path: Routes.NetworkEditor,
    params: '/:name',
    exact: true,
    component: NetworkEditor,
  },
  {
    name: `WalletEditor`,
    path: Routes.WalletEditor,
    params: '/:wallet',
    exact: true,
    component: WalletEditor,
  },
  {
    name: `CreateWallet`,
    path: Routes.CreateWallet,
    exact: false,
    component: CreateWallet,
  },
  {
    name: `ImportWallet`,
    path: Routes.ImportWallet,
    exact: false,
    component: ImportWallet,
  },
  {
    name: `WalletWizard`,
    path: Routes.WalletWizard,
    exact: false,
    component: WalletWizard,
  },
  {
    name: `Terminal`,
    path: Routes.Terminal,
    exact: true,
    component: Terminal,
  },
]

const CustomRouter = (appProps: any) => {
  const wallet = useContext(WalletContext)

  return (
    <Router>
      <Route
        render={(props: RouteComponentProps<{}>) => {
          UILayer.on(Channel.NavTo, (_e: Event, args: Response<{ router: string }>) => {
            props.history.push(args.result.router)
          })

          return (
            <>
              {wallet.address ? <RoutesWithProps contents={containers} /> : null}
              <MainContent {...appProps}>
                <RoutesWithProps contents={mainContents} />
              </MainContent>
            </>
          )
        }}
      />
    </Router>
  )
}

CustomRouter.displayName = 'CustomRouter'

export default CustomRouter
