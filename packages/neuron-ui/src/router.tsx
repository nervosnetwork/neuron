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
import HistoryDetailPage from 'components/HistoryDetailPage'
import Transaction from 'components/Transaction'
import LaunchScreen from 'components/LaunchScreen'
import PasswordRequest from 'components/PasswordRequest'
import NervosDAO from 'components/NervosDAO'
import NervosDAODetail from 'components/NervosDAODetail'
import SpecialAssetList from 'components/SpecialAssetList'
import SUDTAccountList from 'components/SUDTAccountList'
import SUDTSend from 'components/SUDTSend'
import ImportHardware from 'components/ImportHardware'
import OfflineSign from 'components/OfflineSign'
import NFTSend from 'components/NFTSend'
import Settings from 'components/Settings'
import SignAndVerify from 'components/SignAndVerify'

const offlineRouter = {
  path: RoutePath.OfflineSign,
  element: <OfflineSign />,
}

const signVerifyRouter = {
  path: RoutePath.SignVerify,
  element: <SignAndVerify />,
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
        children: [offlineRouter, signVerifyRouter],
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
            children: [offlineRouter, signVerifyRouter],
          },
          {
            path: ':address?',
            element: (
              <>
                <Send />
                <Outlet />
              </>
            ),
            children: [offlineRouter, signVerifyRouter],
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
            children: [offlineRouter, signVerifyRouter],
          },
          {
            path: ':address?',
            element: (
              <>
                <Receive />
                <Outlet />
              </>
            ),
            children: [offlineRouter, signVerifyRouter],
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
        children: [offlineRouter, signVerifyRouter],
      },
      {
        path: `${RoutePath.Transaction}/:hash`,
        element: (
          <>
            <Transaction />
            <Outlet />
          </>
        ),
        children: [offlineRouter, signVerifyRouter],
      },
      {
        path: `${RoutePath.HistoryDetailPage}/:hash`,
        element: (
          <>
            <HistoryDetailPage />
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
        children: [offlineRouter, signVerifyRouter],
      },
      {
        path: RoutePath.ImportKeystore,
        element: (
          <>
            <ImportKeystore />
            <Outlet />
          </>
        ),
        children: [offlineRouter, signVerifyRouter],
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
        children: [offlineRouter, signVerifyRouter],
      },
      {
        path: RoutePath.SUDTAccountList,
        element: (
          <>
            <SUDTAccountList />
            <Outlet />
          </>
        ),
        children: [offlineRouter, signVerifyRouter],
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
            children: [offlineRouter, signVerifyRouter],
          },
          {
            path: ':accountId',
            element: (
              <>
                <SUDTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter, signVerifyRouter],
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
        children: [offlineRouter, signVerifyRouter],
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
            children: [offlineRouter, signVerifyRouter],
          },
          {
            path: ':nftId',
            element: (
              <>
                <NFTSend />
                <Outlet />
              </>
            ),
            children: [offlineRouter, signVerifyRouter],
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
