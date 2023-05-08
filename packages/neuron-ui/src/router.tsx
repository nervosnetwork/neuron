import React from 'react'
import { Outlet, RouteObject } from 'react-router-dom'
import Main from 'containers/Main'
import Navbar from 'containers/Navbar'
import { RoutePath } from 'utils'
import Overview from 'components/Overview'
import WalletWizard from 'components/WalletWizard'
import ImportKeystore from 'components/ImportKeystore'
import Send from 'components/Send'
import Receive from 'components/Receive'
import History from 'components/History'
import Transaction from 'components/Transaction'
import LaunchScreen from 'components/LaunchScreen'
import PasswordRequest from 'components/PasswordRequest'
import NervosDAO from 'components/NervosDAO'
import NervosDAODetail from 'components/NervosDAODetail'
import SpecialAssetList from 'components/SpecialAssetList'
import SUDTAccountList from 'components/SUDTAccountList'
import SUDTSend from 'components/SUDTSend'
import SUDTReceive from 'components/SUDTReceive'
import ImportHardware from 'components/ImportHardware'
import OfflineSign from 'components/OfflineSign'
import NFTSend from 'components/NFTSend'
import Settings from 'components/Settings'

const offlineRouter = {
  path: RoutePath.OfflineSign,
  element: <OfflineSign />,
}

const mainRouterConfig: RouteObject[] = [
  {
    path: '/',
    element: (
      <>
        <Navbar />
        <Main />
        <PasswordRequest />
      </>
    ),
    children: [
      {
        path: RoutePath.Launch,
        element: <LaunchScreen />,
      },
      {
        path: RoutePath.Overview,
        element: (
          <>
            <Overview />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.Send,
        children: [
          {
            path: '',
            element: (
              <>
                <Send />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
          {
            path: ':address?',
            element: (
              <>
                <Send />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
        ],
      },
      {
        path: RoutePath.Receive,
        children: [
          {
            path: '',
            element: (
              <>
                <Receive />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
          {
            path: ':address?',
            element: (
              <>
                <Receive />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
        ],
      },
      {
        path: RoutePath.History,
        element: (
          <>
            <History />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: `${RoutePath.Transaction}/:hash`,
        element: (
          <>
            <Transaction />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: `${RoutePath.WalletWizard}*`,
        element: (
          <>
            <WalletWizard />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.ImportKeystore,
        element: (
          <>
            <ImportKeystore />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.NervosDAO,
        children: [
          {
            path: '',
            element: (
              <>
                <NervosDAO />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
          {
            path: ':depositOutPoint',
            element: (
              <>
                <NervosDAODetail />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
        ],
      },
      {
        path: RoutePath.SpecialAssets,
        element: (
          <>
            <SpecialAssetList />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.SUDTAccountList,
        element: (
          <>
            <SUDTAccountList />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.SUDTSend,
        children: [
          {
            path: '',
            element: (
              <>
                <SUDTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
          {
            path: ':accountId',
            element: (
              <>
                <SUDTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
        ],
      },
      {
        path: RoutePath.SUDTReceive,
        element: (
          <>
            <SUDTReceive />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.ImportHardware,
        element: (
          <>
            <ImportHardware />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
      {
        path: RoutePath.NFTSend,
        children: [
          {
            path: '',
            element: (
              <>
                <NFTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
          {
            path: ':nftId',
            element: (
              <>
                <NFTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter],
          },
        ],
      },
      {
        path: RoutePath.Settings,
        element: (
          <>
            <Settings />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
      },
    ],
  },
]

export default mainRouterConfig
