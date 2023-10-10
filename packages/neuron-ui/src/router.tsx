import React from 'react'
import { Outlet, RouteObject } from 'react-router-dom'
import Main from 'containers/Main'
import Navbar from 'containers/Navbar'
import { RoutePath } from 'utils'
import Overview from 'components/Overview'
import WalletWizard from 'components/WalletWizard'
import ImportKeystore from 'components/ImportKeystore'
import Send from 'components/Send'
import History from 'components/History'
import HistoryDetailPage from 'components/HistoryDetailPage'
import LaunchScreen from 'components/LaunchScreen'
import PasswordRequest from 'components/PasswordRequest'
import NervosDAO from 'components/NervosDAO'
import NervosDAODetail from 'components/NervosDAODetail'
import SpecialAssetList from 'components/SpecialAssetList'
import SUDTAccountList from 'components/SUDTAccountList'
import SUDTSend from 'components/SUDTSend'
import ImportHardware from 'components/ImportHardware'
import OfflineSign from 'components/OfflineSign'
import Settings from 'components/Settings'
import SignAndVerify from 'components/SignAndVerify'
import MultisigAddress from 'components/MultisigAddress'

const toolsRouters = [
  {
    path: RoutePath.OfflineSign,
    element: <OfflineSign />,
  },
  {
    path: RoutePath.SignVerify,
    element: <SignAndVerify />,
  },
  {
    path: RoutePath.MultisigAddress,
    element: <MultisigAddress />,
  },
]

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
        children: [
          {
            path: '',
            element: (
              <>
                <Overview />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
          {
            path: ':hash',
            element: (
              <>
                <HistoryDetailPage />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
        ],
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
            children: [...toolsRouters],
          },
          {
            path: ':address?',
            element: (
              <>
                <Send />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
        ],
      },
      {
        path: RoutePath.History,
        children: [
          {
            path: '',
            element: (
              <>
                <History />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
          {
            path: ':hash',
            element: (
              <>
                <HistoryDetailPage />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
        ],
      },
      {
        path: `${RoutePath.WalletWizard}*`,
        element: (
          <>
            <WalletWizard />
            <Outlet />
          </>
        ),
        children: [...toolsRouters],
      },
      {
        path: RoutePath.ImportKeystore,
        element: (
          <>
            <ImportKeystore />
            <Outlet />
          </>
        ),
        children: [...toolsRouters],
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
            children: [...toolsRouters],
          },
          {
            path: ':depositOutPoint',
            element: (
              <>
                <NervosDAODetail />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
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
        children: [...toolsRouters],
      },
      {
        path: RoutePath.SUDTAccountList,
        element: (
          <>
            <SUDTAccountList />
            <Outlet />
          </>
        ),
        children: [...toolsRouters],
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
            children: [...toolsRouters],
          },
          {
            path: ':accountId',
            element: (
              <>
                <SUDTSend />
                <Outlet />
              </>
            ),
            children: [...toolsRouters],
          },
        ],
      },
      {
        path: RoutePath.ImportHardware,
        element: (
          <>
            <ImportHardware />
            <Outlet />
          </>
        ),
        children: [...toolsRouters],
      },
      {
        path: RoutePath.Settings,
        element: (
          <>
            <Settings />
            <Outlet />
          </>
        ),
        children: [...toolsRouters],
      },
    ],
  },
]

export default mainRouterConfig
