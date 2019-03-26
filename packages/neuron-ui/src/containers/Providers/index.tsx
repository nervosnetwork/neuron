import React, { useReducer, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChainContext from '../../contexts/Chain'
import WalletContext from '../../contexts/Wallet'
import SettingsContext from '../../contexts/Settings'
import { reducer, initProviders, ProviderActions, ProviderDispatch } from './reducer'

import UILayer from '../../services/UILayer'
import { Channel } from '../../utils/const'

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

    UILayer.on(Channel.GetWallets, (_e: any, args: Response<any>) => {
      dispatch({
        type: ProviderActions.Settings,
        payload: {
          wallets: args.result,
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

    UILayer.on(Channel.Wallet, (_e: Event, method: 'activeWallet', args: Response<any>) => {
      if (args.status) {
        switch (method) {
          case 'activeWallet': {
            dispatch({
              type: ProviderActions.Wallet,
              payload: {
                ...args.result,
              },
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

    UILayer.on(Channel.Transactions, (_e: Event, method: 'index' | 'show', args: Response<any>) => {
      if (args.status) {
        switch (method) {
          case 'index': {
            dispatch({
              type: ProviderActions.Chain,
              payload: {
                transactions: args.result,
              },
            })
            break
          }
          case 'show': {
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

    UILayer.on(
      Channel.Networks,
      (
        _e: Event,
        method: 'index' | 'show' | 'create' | 'delete' | 'update' | 'activeNetwork' | 'setActive',
        args: Response<any>,
      ) => {
        if (args.status) {
          switch (method) {
            case 'index': {
              // handle new network list
              dispatch({
                type: ProviderActions.Settings,
                payload: {
                  networks: args.result,
                },
              })
              break
            }
            // case 'show': {
            //   // handle single network
            //   dispatch({
            //     type: ProviderActions.Settings,
            //     payload: {
            //       transaction: args.result,
            //     },
            //   })
            //   break
            // }
            // case 'create': {
            //   break
            // }
            // case 'delete': {
            //   break
            // }
            case 'activeNetwork': {
              dispatch({
                type: ProviderActions.Chain,
                payload: {
                  network: args.result,
                },
              })
              break
            }
            case 'setActive': {
              dispatch({
                type: ProviderActions.Chain,
                payload: {
                  network: args.result,
                },
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
      },
    )
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
