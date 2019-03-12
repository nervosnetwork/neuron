import React, { useReducer, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChainContext, { Cell, Transaction } from '../../contexts/Chain'
import WalletContext from '../../contexts/Wallet'
import SettingsContext from '../../contexts/Settings'
import { reducer, initProviders, ProviderActions, ProviderDispatch } from './reducer'

import UILayer from '../../services/UILayer'
import { Channel, NetworkStatus } from '../../utils/const'
import { loadNetworks } from '../../utils/localStorage'

const withProviders = (Comp: React.ComponentType<{ providerDispatch: ProviderDispatch }>) => (
  props: React.Props<any>,
) => {
  const [providers, dispatch] = useReducer(reducer, initProviders)
  const [, i18n] = useTranslation()
  useEffect(() => {
    UILayer.on(Channel.SetLanguage, (_e: Event, args: Response<string>) => {
      if (args.status) {
        if (args.result !== i18n.language) {
          i18n.changeLanguage(args.result)
        }
      }
    })

    UILayer.on(Channel.GetWallet, (_e: any, args: Response<any>) => {
      dispatch({
        type: ProviderActions.Wallet,
        payload: {
          ...args.result,
        },
      })
    })

    UILayer.on(
      Channel.CreateWallet,
      (_e: Event, args: Response<{ name: string; address: string; publicKey: Uint8Array }>) => {
        if (args.status) {
          // TODO: handle created wallet
        }
      },
    )

    UILayer.on(Channel.DeleteWallet, (_e: Event, args: Response<string>) => {
      if (args.status) {
        // TODO: handle wallet deleted
      }
    })

    UILayer.on(
      Channel.GetNetwork,
      (_e: Event, args: Response<{ name: string; remote: string; connected: boolean }>) => {
        if (args.status) {
          dispatch({
            type: ProviderActions.Chain,
            payload: {
              network: {
                name: args.result.name,
                remote: args.result.remote,
                status: args.result.connected ? NetworkStatus.Online : NetworkStatus.Offline,
              },
            },
          })
        }
      },
    )

    UILayer.on(Channel.GetBalance, (_e: Event, args: Response<number>) => {
      if (args.status) {
        dispatch({
          type: ProviderActions.Wallet,
          payload: {
            balance: args.result,
          },
        })
      }
    })

    UILayer.on(Channel.SendCapacity, () => {
      // TODO
    })

    UILayer.on(Channel.GetCellsByTypeHash, (_e: Event, args: Response<Cell[]>) => {
      // TODO:
      if (args.status) {
        dispatch({
          type: ProviderActions.Chain,
          payload: {
            cells: args.result,
          },
        })
      }
    })

    UILayer.on(
      Channel.GetTransactions,
      (_e: Event, args: Response<{ totalCount: number; items: Transaction[]; pageNo: number; pageSize: number }>) => {
        // TODO:
        if (args.status) {
          dispatch({
            type: ProviderActions.Chain,
            payload: {
              transactions: args.result,
            },
          })
        }
      },
    )
    UILayer.addEventListener('NetworksUpdate', () => {
      const networks = loadNetworks()
      dispatch({
        type: ProviderActions.Settings,
        payload: {
          networks,
        },
      })
    })
  }, [])

  return (
    <SettingsContext.Provider value={providers.settings}>
      <ChainContext.Provider value={providers.chain}>
        <WalletContext.Provider value={providers.wallet}>
          <Comp {...props} providerDispatch={dispatch} />
        </WalletContext.Provider>
      </ChainContext.Provider>
    </SettingsContext.Provider>
  )
}

export default withProviders
