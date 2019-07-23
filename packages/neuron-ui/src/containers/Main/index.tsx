import React, { useMemo } from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useState } from 'states/stateProvider'
import { StateDispatch } from 'states/stateProvider/reducer'

import Overview from 'components/Overview'
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
import PasswordRequest from 'components/PasswordRequest'

import { Routes } from 'utils/const'

import { useChannelListeners, useSyncChainData, useOnCurrentWalletChange } from './hooks'

export const mainContents: CustomRouter.Route[] = [
  {
    name: `launch`,
    path: Routes.Launch,
    exact: true,
    comp: LaunchScreen,
  },
  {
    name: `General`,
    path: Routes.Overview,
    exact: true,
    comp: Overview,
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
  {
    name: `PasswordRequest`,
    path: '/',
    exact: false,
    comp: PasswordRequest,
  },
]

const MainContent = ({
  history,
  dispatch,
}: React.PropsWithoutRef<{ dispatch: StateDispatch } & RouteComponentProps>) => {
  const neuronWalletState = useState()
  const {
    wallet: { id: walletID },
    chain,
    settings: { networks },
  } = neuronWalletState
  const { networkID } = chain
  const [, i18n] = useTranslation()
  useChannelListeners({
    walletID: neuronWalletState.wallet.id,
    chain: neuronWalletState.chain,
    dispatch,
    history,
    i18n,
  })

  const chainURL = useMemo(() => {
    const network = networks.find(n => n.id === networkID)
    return network ? network.remote : ''
  }, [networks, networkID])

  useSyncChainData({
    chainURL,
    dispatch,
  })

  useOnCurrentWalletChange({
    walletID,
    chain,
    i18n,
    history,
    dispatch,
  })

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
