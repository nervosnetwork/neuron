import React, { lazy } from 'react'
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
import SpecialAssetList from 'components/SpecialAssetList'
import SUDTAccountList from 'components/SUDTAccountList'
import SUDTSend from 'components/SUDTSend'
import SUDTReceive from 'components/SUDTReceive'
import ImportHardware from 'components/ImportHardware'
import OfflineSign from 'components/OfflineSign'
import NFTSend from 'components/NFTSend'
import SettingTabs from 'components/SettingTabs'
import NetworkEditor from 'components/NetworkEditor'
import WalletEditor from 'components/WalletEditor'
import GeneralSetting from 'components/GeneralSetting'
import WalletSetting from 'components/WalletSetting'
import NetworkSetting from 'components/NetworkSetting'
import DataSetting from 'components/DataSetting'
import SignAndVerify from 'components/SignAndVerify'
import { useState as useGloablState, useDispatch } from 'states'

const Settings = lazy(() => import('containers/Settings'))

const InjectionProps = ({
  Component,
}: {
  Component: typeof GeneralSetting | typeof WalletSetting | typeof NetworkSetting | typeof DataSetting
}) => {
  const globalState = useGloablState()
  const dispatch = useDispatch()
  return <Component {...globalState} dispatch={dispatch} />
}

export const settingRouterConfig: RouteObject[] = [
  {
    path: '',
    element: (
      <>
        <Settings isDetachedWindow />
        <PasswordRequest />
      </>
    ),
    children: [
      {
        path: RoutePath.Settings,
        element: <SettingTabs />,
        children: [
          { path: RoutePath.SettingsGeneral, element: <InjectionProps Component={GeneralSetting} /> },
          { path: RoutePath.SettingsWallets, element: <InjectionProps Component={WalletSetting} /> },
          { path: RoutePath.SettingsNetworks, element: <InjectionProps Component={NetworkSetting} /> },
          { path: RoutePath.SettingsData, element: <InjectionProps Component={DataSetting} /> },
        ],
      },
      { path: `${RoutePath.NetworkEditor}/:id`, element: <NetworkEditor /> },
      { path: `${RoutePath.WalletEditor}/:id`, element: <WalletEditor /> },
      { path: `${RoutePath.WalletWizard}*`, element: <WalletWizard isSettings /> },
      { path: RoutePath.ImportKeystore, element: <ImportKeystore /> },
      { path: RoutePath.ImportHardware, element: <ImportHardware /> },
    ],
  },
]

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
        element: (
          <>
            <NervosDAO />
            <Outlet />
          </>
        ),
        children: [offlineRouter, signVerifyRouter],
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
        path: RoutePath.SUDTReceive,
        element: (
          <>
            <SUDTReceive />
            <Outlet />
          </>
        ),
        children: [offlineRouter, signVerifyRouter],
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
        element: <Settings />,
        children: [
          { index: true, element: <InjectionProps Component={GeneralSetting} /> },
          { path: RoutePath.SettingsWallets, element: <InjectionProps Component={WalletSetting} /> },
          { path: RoutePath.SettingsNetworks, element: <InjectionProps Component={NetworkSetting} /> },
          { path: RoutePath.SettingsData, element: <InjectionProps Component={DataSetting} /> },
          offlineRouter,
          signVerifyRouter,
        ],
      },
    ],
  },
]

export default mainRouterConfig
