import React, { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch, NeuronWalletActions, AppActions } from 'states'

import { LocalCacheKey } from 'services/localCache'
import {
  AppUpdater as AppUpdaterSubject,
  Navigation as NavigationSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { useOnLocalStorageChange, useOnLocaleChange } from 'utils'
import PageContainer from 'components/PageContainer'
import WalletSetting from 'components/WalletSetting'
import GeneralSetting from 'components/GeneralSetting'
import NetworkSetting from 'components/NetworkSetting'
import DataSetting from 'components/DataSetting'
import styles from './settings.module.scss'

const items = [
  ['wallets', WalletSetting],
  ['general', GeneralSetting],
  ['network', NetworkSetting],
  ['data', DataSetting],
]

const Settings = () => {
  const dispatch = useDispatch()
  const globalState = useGlobalState()
  const navigate = useNavigate()
  const [t, i18n] = useTranslation()

  useOnLocaleChange(i18n)

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
  return (
    <PageContainer head={t('navbar.settings')}>
      <div className={styles.container}>
        {items.map(([title, ItemCmp]) => (
          <div className={styles.item} key={title as string}>
            <div className={styles.title}>{t(`settings.setting-tabs.${title}`)}</div>
            <div className={styles.content}>
              <ItemCmp {...globalState} dispatch={dispatch} />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

Settings.displayName = 'Settings'

export default Settings
