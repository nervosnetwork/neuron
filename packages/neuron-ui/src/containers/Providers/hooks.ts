import React, { useEffect } from 'react'
import { history } from 'components/Router'

import UILayer, { NetworksMethod, TransactionsMethod, WalletsMethod } from 'services/UILayer'
import { Channel, ConnectStatus, Routes } from 'utils/const'
import { ProviderActions } from './reducer'

export const useChannelListeners = (i18n: any, chain: any, dispatch: React.Dispatch<any>) =>
  useEffect(() => {
    UILayer.on(
      Channel.Initiate,
      (
        _e: Event,
        args: ChannelResponse<{
          networks: any
          activeNetworkId: string
          wallets: any
          activeWallet: any
          locale: string
        }>,
      ) => {
        if (args.status) {
          const { locale, networks, activeNetworkId: networkId, wallets, activeWallet: wallet } = args.result
          if (locale !== i18n.language) {
            i18n.changeLanguage(locale)
          }
          if (networks.length) {
            dispatch({
              type: ProviderActions.Initiate,
              payload: { networks, networkId, wallet, wallets },
            })
          }
        } else {
          // TODO: better prompt
          window.alert(i18n.t('messages.failed-to-initiate,-please-reopen-Neuron'))
          window.close()
        }
      },
    )

    UILayer.on(Channel.NavTo, (_e: Event, _method: '', args: ChannelResponse<string>) => {
      history.push(args.result)
    })

    UILayer.on(Channel.Transactions, (_e: Event, method: TransactionsMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        switch (method) {
          case TransactionsMethod.GetAllByAddresses: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { transactions: { ...chain.transactions, ...args.result } },
            })
            break
          }
          case TransactionsMethod.Get: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { transaction: { ...chain.transaction, ...args.result } },
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        // TODO: handle error
      }
    })

    UILayer.on(Channel.Wallets, (_e: Event, method: WalletsMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        switch (method) {
          case WalletsMethod.Create:
          case WalletsMethod.ImportMnemonic:
          case WalletsMethod.Update: {
            let template = ''
            if (method === WalletsMethod.Create) {
              template = 'messages.wallet-created-successfully'
            } else if (method === WalletsMethod.Update) {
              template = 'messages.wallet-updated-successfully'
            } else {
              template = 'messages.wallet-imported-successfully'
            }
            const content = i18n.t(template, { name: args.result.name })
            const time = new Date().getTime()
            dispatch({
              type: ProviderActions.AddMessage,
              payload: {
                category: 'success',
                title: 'Wallet',
                content,
                actions: [],
                time,
                dismiss: () => {
                  dispatch({
                    type: ProviderActions.DismissMessage,
                    payload: time,
                  })
                },
              },
            })
            // TODO: so imperative, better refactor
            history.push(Routes.SettingsWallets)
            break
          }
          case WalletsMethod.GetAll: {
            dispatch({
              type: ProviderActions.Settings,
              payload: { wallets: args.result },
            })
            break
          }
          case WalletsMethod.GetActive: {
            dispatch({
              type: ProviderActions.Wallet,
              payload: args.result,
            })
            break
          }
          case WalletsMethod.Delete: {
            dispatch({
              type: ProviderActions.Settings,
              payload: { wallets: args.result.allWallets },
            })
            dispatch({
              type: ProviderActions.Wallet,
              payload: args.result.activeWallet,
            })
            break
          }
          case WalletsMethod.SendCapacity: {
            history.push(`${Routes.Transaction}/${args.result}`)
            break
          }
          default: {
            break
          }
        }
      } else {
        const time = new Date().getTime()
        if (method === WalletsMethod.GetActive) {
          return
        }
        const title = method === WalletsMethod.SendCapacity ? 'Transaction' : 'Wallet'
        const { content, id } =
          typeof args.msg === 'string' ? { content: args.msg, id: null } : args.msg || { content: '', id: null }

        dispatch({
          type: ProviderActions.AddMessage,
          payload: {
            category: 'danger',
            title,
            id,
            content,
            time,
            actions: [],
            dismiss: () => {
              dispatch({
                type: ProviderActions.DismissMessage,
                payload: time,
              })
            },
          },
        })
      }
    })

    UILayer.on(Channel.Networks, (_e: Event, method: NetworksMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        switch (method) {
          case NetworksMethod.GetAll: {
            dispatch({
              type: ProviderActions.Settings,
              payload: { networks: args.result },
            })
            break
          }
          case NetworksMethod.ActiveId: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { networkId: args.result },
            })
            break
          }
          case NetworksMethod.Create:
          case NetworksMethod.Update: {
            // TODO: so imperative, better refactor
            history.push(Routes.SettingsNetworks)
            break
          }
          case NetworksMethod.Activate: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { network: args.result },
            })
            break
          }
          case NetworksMethod.Status: {
            dispatch({
              type: ProviderActions.Chain,
              payload: {
                connectStatus: args.result ? ConnectStatus.Online : ConnectStatus.Offline,
              },
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        const time = new Date().getTime()
        dispatch({
          type: ProviderActions.AddMessage,
          payload: {
            category: 'danger',
            title: 'Networks',
            content: args.msg,
            time,
            actions: [
              {
                label: 'view',
                action: Routes.SettingsNetworks,
              },
            ],
            dismiss: () => {
              dispatch({
                type: ProviderActions.DismissMessage,
                payload: time,
              })
            },
          },
        })
      }
    })
  }, [i18n, chain, dispatch])

export default {
  useChannelListeners,
}
