import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useState } from 'states/stateProvider'
import { StateDispatch } from 'states/stateProvider/reducer'

import General from 'components/General'
import WalletWizard from 'components/WalletWizard'
import Send from 'components/Send'
import Receive from 'components/Receive'
import History from 'components/History'
import Transaction from 'components/Transaction'
import Settings from 'components/Settings'
import Addresses from 'components/Addresses'
import NetworkEditor from 'components/NetworkEditor'
import WalletEditor from 'components/WalletEditor'
import LaunchScreen from 'components/LaunchScreen'

import { Routes } from 'utils/const'

import { useChannelListeners } from './hooks'

export const mainContents: CustomRouter.Route[] = [
  {
    name: `launch`,
    path: Routes.Launch,
    exact: true,
    comp: LaunchScreen,
  },
  {
    name: `General`,
    path: Routes.General,
    exact: true,
    comp: General,
  },
  {
    name: `Send`,
    path: Routes.Send,
    params: `/:address?`,
    exact: false,
    comp: Send,
  },
  {
    name: `Receive`,
    path: Routes.Receive,
    params: `/:address?`,
    exact: false,
    comp: Receive,
  },
  {
    name: `History`,
    path: Routes.History,
    exact: false,
    comp: History,
  },
  {
    name: `Transaction`,
    path: Routes.Transaction,
    params: `/:hash`,
    exact: false,
    comp: Transaction,
  },
  {
    name: `Addresses`,
    path: Routes.Addresses,
    exact: false,
    comp: Addresses,
  },
  {
    name: `Settings`,
    path: Routes.Settings,
    exact: false,
    comp: Settings,
  },
  {
    name: `NetworkEditor`,
    path: Routes.NetworkEditor,
    params: '/:id',
    exact: false,
    comp: NetworkEditor,
  },
  {
    name: `WalletEditor`,
    path: Routes.WalletEditor,
    params: '/:id',
    exact: false,
    comp: WalletEditor,
  },
  {
    name: `WalletWizard`,
    path: Routes.WalletWizard,
    exact: false,
    comp: WalletWizard,
  },
]

const MainContent = ({
  history,
  dispatch,
}: React.PropsWithoutRef<{ dispatch: StateDispatch } & RouteComponentProps>) => {
  const neuronWalletState = useState()
  const [, i18n] = useTranslation()
  useChannelListeners(i18n, history, neuronWalletState.chain, dispatch)
  return (
    <>
      {mainContents.map(container => (
        <Route
          exact={container.exact}
          path={`${container.path}${container.params || ''}`}
          key={container.name}
          render={routerProps => {
            return <container.comp {...routerProps} {...neuronWalletState} dispatch={dispatch} />
          }}
        />
      ))}
    </>
  )
}

MainContent.displayName = 'Main'

export default MainContent
