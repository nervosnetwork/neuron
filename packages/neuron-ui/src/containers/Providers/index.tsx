import React, { useReducer, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import NeuronWalletContext from '../../contexts/NeuronWallet'
import { reducer, initProviders, ProviderActions, ProviderDispatch } from './reducer'

import UILayer, { NetworksMethod, TransactionsMethod, WalletsMethod } from '../../services/UILayer'
import { Channel, Routes } from '../../utils/const'

const withProviders = (Comp: React.ComponentType<{ providerDispatch: ProviderDispatch }>) => (
  props: React.Props<any>,
) => {
  const [providers, dispatch] = useReducer(reducer, initProviders)
  const [, i18n] = useTranslation()
  useEffect(() => {
    UILayer.on(Channel.SetLanguage, (_e: Event, args: ChannelResponse<string>) => {
      if (args.status) {
        if (args.result !== i18n.language) {
          i18n.changeLanguage(args.result)
        }
      }
    })

    UILayer.on(Channel.GetBalance, (_e: Event, args: ChannelResponse<number>) => {
      if (args.status) {
        dispatch({
          type: ProviderActions.Wallet,
          payload: { balance: args.result },
        })
      }
    })

    UILayer.on(Channel.Transactions, (_e: Event, method: TransactionsMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        switch (method) {
          case TransactionsMethod.GetAll: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { transactions: { ...providers.chain.transactions, ...args.result } },
            })
            break
          }
          case TransactionsMethod.Get: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { transaction: { ...providers.chain.transaction, ...args.result } },
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
          case WalletsMethod.GetAll: {
            dispatch({
              type: ProviderActions.Settings,
              payload: { wallets: args.result },
            })
            break
          }
          case WalletsMethod.ActiveOne: {
            dispatch({
              type: ProviderActions.Wallet,
              payload: args.result,
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        const time = new Date().getTime()
        if (method === WalletsMethod.ActiveOne) {
          // don't show this error in wizard view
          return
        }

        dispatch({
          type: ProviderActions.AddMessage,
          payload: {
            category: 'error',
            title: 'Wallet',
            content: args.msg,
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
          case NetworksMethod.ActiveOne: {
            dispatch({
              type: ProviderActions.Chain,
              payload: { network: args.result },
            })
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
            category: 'error',
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
  }, [])

  return (
    <NeuronWalletContext.Provider value={providers}>
      <Comp {...props} providerDispatch={dispatch} />
    </NeuronWalletContext.Provider>
  )
}

export default withProviders
