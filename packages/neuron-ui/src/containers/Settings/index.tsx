import React, { useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import SettingTabs from 'components/SettingTabs'
import NetworkEditor from 'components/NetworkEditor'
import WalletEditor from 'components/WalletEditor'
import WalletWizard from 'components/WalletWizard'
import ImportKeystore from 'components/ImportKeystore'
import PasswordRequest from 'components/PasswordRequest'

import { useDispatch, NeuronWalletActions, AppActions } from 'states'

import { LocalCacheKey } from 'services/localCache'
import {
  AppUpdater as AppUpdaterSubject,
  Navigation as NavigationSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { getPlatform } from 'services/remote'
import { RoutePath, useRoutes, useOnLocalStorageChange, useOnLocaleChange } from 'utils'

export const settingContents: CustomRouter.Route[] = [
  { name: `SettingTabs`, path: RoutePath.Settings, exact: false, component: SettingTabs },
  { name: `NetworkEditor`, path: RoutePath.NetworkEditor, params: '/:id', exact: false, component: NetworkEditor },
  { name: `WalletEditor`, path: RoutePath.WalletEditor, params: '/:id', exact: false, component: WalletEditor },
  { name: `WalletWizard`, path: RoutePath.WalletWizard, exact: false, component: WalletWizard },
  { name: `ImportKeystore`, path: RoutePath.ImportKeystore, exact: false, component: ImportKeystore },
  { name: `PasswordRequest`, path: '/', exact: false, component: PasswordRequest },
]

const Settings = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const [, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  useEffect(() => {
    const isMac = getPlatform() === 'darwin'
    window.document.title = i18n.t(`settings.title.${isMac ? 'mac' : 'normal'}`)
  }, [i18n.language])

  useEffect(() => {
    const onNavigate = (url: string) => history.push(url)

    const onAppUpdaterUpdates = (info: Subject.AppUpdater) => {
      dispatch({ type: NeuronWalletActions.UpdateAppUpdaterStatus, payload: info })
    }

    const onCommand = ({ type, payload }: Subject.CommandMetaInfo) => {
      if (payload) {
        switch (type) {
          case 'delete-wallet': {
            dispatch({ type: AppActions.RequestPassword, payload: { walletID: payload, actionType: 'delete' } })
            break
          }
          case 'backup-wallet': {
            dispatch({ type: AppActions.RequestPassword, payload: { walletID: payload, actionType: 'backup' } })
            break
          }
          default: {
            // ignore
          }
        }
      } else {
        console.warn('Empty payload from command')
      }
    }

    const navSubscription = NavigationSubject.subscribe(onNavigate)
    const appUpdaterSubscription = AppUpdaterSubject.subscribe(onAppUpdaterUpdates)
    const commandSubscription = CommandSubject.subscribe(onCommand)

    return () => {
      navSubscription.unsubscribe()
      appUpdaterSubscription.unsubscribe()
      commandSubscription.unsubscribe()
    }
  }, [dispatch, history])

  const onChange = useCallback(
    (e: StorageEvent) => {
      if (!e.newValue) {
        return
      }
      try {
        switch (e.key as LocalCacheKey) {
          case LocalCacheKey.CurrentWallet: {
            dispatch({
              type: NeuronWalletActions.UpdateCurrentWallet,
              payload: JSON.parse(e.newValue) as Partial<State.Wallet>,
            })
            break
          }
          case LocalCacheKey.Wallets: {
            dispatch({
              type: NeuronWalletActions.UpdateWalletList,
              payload: JSON.parse(e.newValue) as State.WalletIdentity[],
            })
            break
          }
          case LocalCacheKey.CurrentNetworkID: {
            dispatch({
              type: NeuronWalletActions.UpdateCurrentNetworkID,
              payload: e.newValue,
            })
            break
          }
          case LocalCacheKey.Networks: {
            dispatch({
              type: NeuronWalletActions.UpdateNetworkList,
              payload: JSON.parse(e.newValue) as State.Network[],
            })
            break
          }
          default: {
            // ignore
          }
        }
      } catch (err) {
        console.error(err)
      }
    },
    [dispatch]
  )

  useOnLocalStorageChange(onChange)
  const routes = useRoutes(settingContents)
  return <>{routes}</>
}

Settings.displayName = 'Settings'

export default Settings
