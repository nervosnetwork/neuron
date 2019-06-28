/* globals BigInt */
import React, { useEffect } from 'react'
import { history } from 'components/Router'

import UILayer, { AppMethod, ChainMethod, NetworksMethod, TransactionsMethod, WalletsMethod } from 'services/UILayer'
import { Channel, ConnectStatus, Routes } from 'utils/const'
import { Address } from 'contexts/NeuronWallet/wallet'
import { ProviderActions } from './reducer'

const addressesToBalance = (addresses: Address[] = []) => {
  return addresses.reduce((total, addr) => total + BigInt(addr.balance || 0), BigInt(0)).toString()
}

export const useChannelListeners = (i18n: any, chain: any, dispatch: React.Dispatch<any>) =>
  useEffect(() => {
    UILayer.on(
      Channel.Initiate,
      (
        _e: Event,
        args: ChannelResponse<{
          networks: any
          balance: string
          activeNetworkId: string
          wallets: any
          activeWallet: any
          addresses: Address[]
          transactions: any
          locale: string
          tipNumber: string
          connectStatus: boolean
        }>
      ) => {
        if (args.status) {
          const {
            locale,
            networks = [],
            activeNetworkId: networkId,
            wallets = [],
            activeWallet: wallet,
            addresses = [],
            transactions = [],
            tipNumber = '0',
            connectStatus = false,
          } = args.result
          if (locale !== i18n.language) {
            i18n.changeLanguage(locale)
          }
          if (networks.length) {
            dispatch({
              type: ProviderActions.Initiate,
              payload: {
                networks,
                networkId,
                wallet: { ...wallet, balance: addressesToBalance(addresses), addresses },
                wallets,
              },
            })
          }
          dispatch({
            type: ProviderActions.Chain,
            payload: {
              tipBlockNumber: tipNumber,
              connectStatus: connectStatus ? ConnectStatus.Online : ConnectStatus.Offline,
              transactions: { ...chain.transactions, ...transactions },
            },
          })
        } else {
          /* eslint-disable no-alert */
          // TODO: better prompt, prd required
          window.alert(i18n.t('messages.failed-to-initiate,-please-reopen-Neuron'))
          /* eslint-enable no-alert */
          window.close()
        }
      }
    )

    UILayer.on(Channel.App, (_e: Event, method: AppMethod, args: ChannelResponse<any>) => {
      if (args && args.status) {
        switch (method) {
          case AppMethod.NavTo: {
            history.push(args.result)
            break
          }
          case AppMethod.ToggleAddressBook: {
            dispatch({
              type: ProviderActions.Settings,
              payload: {
                toggleAddressBook: true,
              },
            })
            break
          }
          default: {
            break
          }
        }
      }
    })

    UILayer.on(Channel.Chain, (_e: Event, method: ChainMethod, args: ChannelResponse<any>) => {
      if (args && args.status) {
        switch (method) {
          case ChainMethod.Status: {
            dispatch({
              type: ProviderActions.Chain,
              payload: {
                connectStatus: args.result ? ConnectStatus.Online : ConnectStatus.Offline,
              },
            })
            break
          }
          case ChainMethod.TipBlockNumber: {
            dispatch({
              type: ProviderActions.Chain,
              payload: {
                tipBlockNumber: args.result,
              },
            })
            break
          }
          default: {
            break
          }
        }
      }
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
              payload: { transaction: args.result },
            })
            break
          }
          default: {
            break
          }
        }
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
            if (args.result) {
              history.push(Routes.History)
            }
            break
          }
          case WalletsMethod.SendingStatus: {
            dispatch({
              type: ProviderActions.Wallet,
              payload: {
                sending: args.result,
              },
            })
            break
          }
          case WalletsMethod.AllAddresses: {
            const addresses = args.result || []
            dispatch({
              type: ProviderActions.Wallet,
              payload: {
                addresses,
                balance: addressesToBalance(addresses),
              },
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        if (!args.msg) return
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
