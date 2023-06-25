import React, { useCallback, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, NeuronWalletActions, AppActions } from 'states'

import { LocalCacheKey } from 'services/localCache'
import {
  AppUpdater as AppUpdaterSubject,
  Navigation as NavigationSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { getPlatform } from 'services/remote'
import { useOnLocalStorageChange, useOnLocaleChange } from 'utils'

const Settings = ({ isDetachedWindow }: { isDetachedWindow?: boolean }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  useEffect(() => {
    if (isDetachedWindow) {
      const isMac = getPlatform() === 'darwin'
      window.document.title = i18n.t(`settings.title.${isMac ? 'mac' : 'normal'}`)
      // eslint-disable-next-line
    }
  }, [i18n.language, isDetachedWindow])

  useEffect(() => {
    const onNavigate = (url: string) => navigate(url)

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
  }, [dispatch, navigate])

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
  return <Outlet />
}

Settings.displayName = 'Settings'

export default Settings
