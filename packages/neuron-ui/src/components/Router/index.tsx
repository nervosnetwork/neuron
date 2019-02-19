import React, { useContext } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'
import { Routes } from '../../utils/const'
import DefaultLayout from '../../containers/DefaultLayout'
import EmptyLayout from '../../containers/EmptyLayout'

import WalletDetail from '../WalletDetail'
import Send from '../Transfer'
import Receive from '../Receive'
import History from '../History'
import Addresses from '../Addresses'
import Settings from '../Settings'
import WalletWizard, { ImportWallet, CreateWallet } from '../WalletWizard'
import WalletContext from '../../contexts/wallet'

interface CustomRoute {
  path: string
  name: string
  exact?: boolean
  component: React.ComponentType
}

const unAuthViews = [
  {
    name: 'GlobalCreateWallet',
    path: Routes.CreateWallet,
    exact: false,
    component: EmptyLayout(CreateWallet),
  },
  {
    name: 'GlobalImportWallet',
    path: Routes.ImportWallet,
    exact: false,
    component: EmptyLayout(ImportWallet),
  },
  {
    name: 'GlobalWalletWizard',
    path: Routes.WalletWizard,
    exact: false,
    component: EmptyLayout(WalletWizard),
  },
]
export const authViews: CustomRoute[] = [
  {
    name: 'Wallet',
    path: Routes.Wallet,
    exact: false,
    component: DefaultLayout(WalletDetail),
  },
  {
    name: 'Send',
    path: Routes.Send,
    exact: false,
    component: DefaultLayout(Send),
  },
  {
    name: 'Receive',
    path: Routes.Receive,
    exact: false,
    component: DefaultLayout(Receive),
  },
  {
    name: 'History',
    path: Routes.History,
    exact: false,
    component: DefaultLayout(History),
  },
  {
    name: 'Addresses',
    path: Routes.Addresses,
    exact: false,
    component: DefaultLayout(Addresses),
  },
  {
    name: 'Settings',
    path: Routes.Settings,
    exact: false,
    component: DefaultLayout(Settings),
  },
  {
    name: 'WalletWizard',
    path: Routes.Wizard,
    exact: false,
    component: DefaultLayout(WalletWizard),
  },
]

const renderComp = (route: CustomRoute) => <Route key={route.name} {...route} />

const CustomRouter = () => {
  const wallet = useContext(WalletContext)
  return (
    <Router>
      <Switch>
        {unAuthViews.map(renderComp)}
        <Route
          render={() => {
            if (!wallet) {
              return <Redirect to={Routes.WalletWizard} />
            }
            return (
              <Switch>
                {authViews.map(renderComp)}
                <Redirect from="*" to={Routes.Wallet} />
              </Switch>
            )
          }}
        />
      </Switch>
    </Router>
  )
}

CustomRouter.displayName = 'CustomRouter'

export default CustomRouter
