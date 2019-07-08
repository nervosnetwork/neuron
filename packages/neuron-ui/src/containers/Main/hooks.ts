/* globals BigInt */
import { useEffect } from 'react'

import UILayer, { AppMethod, ChainMethod, NetworksMethod, TransactionsMethod, WalletsMethod } from 'services/UILayer'
import { Routes, Channel, ConnectStatus } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import { NeuronWalletActions, StateDispatch, AppActions } from 'states/stateProvider/reducer'
import { actionCreators } from 'states/stateProvider/actionCreators'
import initStates from 'states/initStates'

const addressesToBalance = (addresses: State.Address[] = []) => {
  return addresses.reduce((total, addr) => total + BigInt(addr.balance || 0), BigInt(0)).toString()
}

export const useChannelListeners = (i18n: any, history: any, chain: any, dispatch: StateDispatch) =>
  useEffect(() => {
    UILayer.on(
      Channel.Initiate,
      (
        _e: Event,
        args: ChannelResponse<{
          networks: any
          balance: string
          currentNetworkID: string
          wallets: [{ id: string; name: string }]
          currentWallet: { id: string; name: string } | null
          addresses: State.Address[]
          transactions: any
          locale: string
          tipNumber: string
          connectStatus: boolean
        }>
      ) => {
        if (args.status) {
          const {
            locale = 'zh-CN',
            networks = [],
            currentNetworkID: networkID = '',
            wallets = [],
            currentWallet: wallet = initStates.wallet,
            addresses = [],
            transactions = initStates.chain.transactions,
            tipNumber = '0',
            connectStatus = false,
          } = args.result
          if (locale !== i18n.language) {
            i18n.changeLanguage(locale)
          }
          if (networks.length) {
            dispatch({
              type: NeuronWalletActions.Initiate,
              payload: {
                networks,
                networkID,
                wallet: { ...wallet, balance: addressesToBalance(addresses), addresses },
                wallets,
              },
            })
          }
          dispatch({
            type: NeuronWalletActions.Chain,
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
            dispatch(actionCreators.toggleAddressBook())
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
              type: NeuronWalletActions.Chain,
              payload: {
                connectStatus: args.result ? ConnectStatus.Online : ConnectStatus.Offline,
              },
            })
            break
          }
          case ChainMethod.TipBlockNumber: {
            dispatch({
              type: NeuronWalletActions.Chain,
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
          case TransactionsMethod.GetAllByKeywords: {
            dispatch({
              type: NeuronWalletActions.Chain,
              payload: { transactions: { ...chain.transactions, ...args.result } },
            })
            break
          }
          case TransactionsMethod.Get: {
            dispatch({
              type: NeuronWalletActions.Chain,
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
            dispatch({
              type: AppActions.AddNotification,
              payload: {
                type: 'success',
                content,
                timestamp: Date.now(),
              },
            })
            history.push(Routes.SettingsWallets)
            break
          }
          case WalletsMethod.GetAll: {
            dispatch({
              type: NeuronWalletActions.Settings,
              payload: { wallets: args.result },
            })
            if (!args.result.length) {
              history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
            }
            break
          }
          case WalletsMethod.GetCurrent: {
            dispatch({
              type: NeuronWalletActions.Wallet,
              payload: args.result,
            })
            break
          }
          case WalletsMethod.Delete: {
            dispatch({
              type: NeuronWalletActions.Settings,
              payload: { wallets: args.result.allWallets },
            })
            dispatch({
              type: NeuronWalletActions.Wallet,
              payload: args.result.currentWallet,
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
              type: NeuronWalletActions.Wallet,
              payload: {
                sending: args.result,
              },
            })
            break
          }
          case WalletsMethod.AllAddresses: {
            const addresses = args.result || []
            dispatch({
              type: NeuronWalletActions.Wallet,
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
        if (method === WalletsMethod.GetCurrent) {
          return
        }
        const { content } = typeof args.msg === 'string' ? { content: args.msg } : args.msg || { content: '' }
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            content,
            timestamp: Date.now(),
          },
        })
      }
    })

    UILayer.on(Channel.Networks, (_e: Event, method: NetworksMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        switch (method) {
          case NetworksMethod.GetAll: {
            dispatch({
              type: NeuronWalletActions.Settings,
              payload: { networks: args.result },
            })
            break
          }
          case NetworksMethod.CurrentID: {
            dispatch({
              type: NeuronWalletActions.Chain,
              payload: { networkID: args.result },
            })
            break
          }
          case NetworksMethod.Create:
          case NetworksMethod.Update: {
            history.push(Routes.SettingsNetworks)
            break
          }
          case NetworksMethod.Activate: {
            dispatch({
              type: NeuronWalletActions.Chain,
              payload: { network: args.result },
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            content: args.msg,
            timestamp: Date.now(),
          },
        })
      }
    })
  }, [i18n, chain, dispatch, history])

export default {
  useChannelListeners,
}
