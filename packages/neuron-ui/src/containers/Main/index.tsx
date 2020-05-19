import React, { useMemo } from 'react'
import { Route, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useState as useGlobalState, useDispatch } from 'states'

import Overview from 'components/Overview'
import WalletWizard from 'components/WalletWizard'
import ImportKeystore from 'components/ImportKeystore'
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
import NervosDAO from 'components/NervosDAO'
import SpecialAssetList from 'components/SpecialAssetList'
import SUDTAccountList from 'components/SUDTAccountList'
import SUDTSend from 'components/SUDTSend'
import SUDTReceive from 'components/SUDTReceive'

import { RoutePath, useOnDefaultContextMenu } from 'utils'

import { useSubscription, useSyncChainData, useOnCurrentWalletChange } from './hooks'

export const mainContents: CustomRouter.Route[] = [
  {
    name: `Launch`,
    path: RoutePath.Launch,
    exact: true,
    component: LaunchScreen,
  },
  {
    name: `General`,
    path: RoutePath.Overview,
    exact: true,
    component: Overview,
  },
  {
    name: `Send`,
    path: RoutePath.Send,
    params: `/:address?`,
    exact: false,
    component: Send,
  },
  {
    name: `Receive`,
    path: RoutePath.Receive,
    params: `/:address?`,
    exact: false,
    component: Receive,
  },
  {
    name: `History`,
    path: RoutePath.History,
    exact: false,
    component: History,
  },
  {
    name: `Transaction`,
    path: RoutePath.Transaction,
    params: `/:hash`,
    exact: false,
    component: Transaction,
  },
  {
    name: `Addresses`,
    path: RoutePath.Addresses,
    exact: false,
    component: Addresses,
  },
  {
    name: `Settings`,
    path: RoutePath.Settings,
    exact: false,
    component: Settings,
  },
  {
    name: `NetworkEditor`,
    path: RoutePath.NetworkEditor,
    params: '/:id',
    exact: false,
    component: NetworkEditor,
  },
  {
    name: `WalletEditor`,
    path: RoutePath.WalletEditor,
    params: '/:id',
    exact: false,
    component: WalletEditor,
  },
  {
    name: `WalletWizard`,
    path: RoutePath.WalletWizard,
    exact: false,
    component: WalletWizard,
  },
  {
    name: `ImportKeystore`,
    path: RoutePath.ImportKeystore,
    exact: false,
    component: ImportKeystore,
  },
  {
    name: `PasswordRequest`,
    path: '/',
    exact: false,
    component: PasswordRequest,
  },
  {
    name: `NervosDAO`,
    path: RoutePath.NervosDAO,
    exact: true,
    component: NervosDAO,
  },
  {
    name: `SpecialAssets`,
    path: RoutePath.SpecialAssets,
    exact: false,
    component: SpecialAssetList,
  },
  {
    name: `SUDTAccountList`,
    path: RoutePath.SUDTAccountList,
    exact: true,
    component: SUDTAccountList,
  },
  {
    name: `SUDTSend`,
    path: RoutePath.SUDTSend,
    params: `/:accountId?`,
    exact: false,
    component: SUDTSend,
  },
  {
    name: `SUDTReceive`,
    path: RoutePath.SUDTReceive,
    exact: false,
    component: SUDTReceive,
  },
]

const MainContent = () => {
  const history = useHistory()
  const {
    app: { isAllowedToFetchList = true },
    wallet: { id: walletID = '' },
    chain,
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const { networkID } = chain
  const [t] = useTranslation()

  useSubscription({
    walletID,
    chain,
    isAllowedToFetchList,
    history,
    dispatch,
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
    history,
    dispatch,
  })
  const onContextMenu = useOnDefaultContextMenu(t)

  return (
    <div onContextMenu={onContextMenu}>
      {mainContents.map(container => (
        <Route
          exact={container.exact}
          path={`${container.path}${container.params || ''}`}
          key={container.name}
          component={container.component}
        />
      ))}
    </div>
  )
}

MainContent.displayName = 'Main'

export default MainContent
