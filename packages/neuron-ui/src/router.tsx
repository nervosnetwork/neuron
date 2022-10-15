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
import Addresses from 'components/Addresses'
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
import { useState as useGloablState, useDispatch } from 'states'

const Notification = lazy(() => import('containers/Notification'))
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
        <Settings />
        <Notification />
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

const mainRouterConfig: RouteObject[] = [
  {
    path: '/',
    element: (
      <>
        <Navbar />
        <Main />
        <Notification />
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
        path: RoutePath.Addresses,
        element: (
          <>
            <Addresses />
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
        element: (
          <>
            <NervosDAO />
            <Outlet />
          </>
        ),
        children: [offlineRouter],
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
    ],
  },
]

export default mainRouterConfig
