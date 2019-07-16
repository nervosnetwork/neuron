/* globals BigInt */
import { useEffect } from 'react'

import { WalletWizardPath } from 'components/WalletWizard'
import { NeuronWalletActions, StateDispatch, AppActions } from 'states/stateProvider/reducer'
import { actionCreators } from 'states/stateProvider/actionCreators'
import initStates from 'states/initStates'

import UILayer, {
  AppMethod,
  ChainMethod,
  NetworksMethod,
  TransactionsMethod,
  WalletsMethod,
  walletsCall,
  transactionsCall,
  networksCall,
} from 'services/UILayer'
import { ckbCore, getTipBlockNumber } from 'services/chain'
import { Routes, Channel, ConnectStatus } from 'utils/const'
import {
  wallets as walletsCache,
  networks as networksCache,
  addresses as addressesCache,
  currentNetworkID as currentNetworkIDCache,
  currentWallet as currentWalletCache,
} from 'utils/localCache'

let timer: NodeJS.Timeout
const SYNC_INTERVAL_TIME = 10000

const addressesToBalance = (addresses: State.Address[] = []) => {
  return addresses.reduce((total, addr) => total + BigInt(addr.balance || 0), BigInt(0)).toString()
}

export const useChannelListeners = ({
  walletID,
  chain,
  dispatch,
  history,
  i18n,
}: {
  walletID: string
  chain: State.Chain
  dispatch: StateDispatch
  history: any
  i18n: any
}) =>
  useEffect(() => {
    UILayer.on(
      Channel.DataUpdate,
      (
        _e: Event,
        _actionType: 'create' | 'update' | 'delete',
        dataType: 'address' | 'transaction' | 'wallet' | 'network'
      ) => {
        switch (dataType) {
          case 'address': {
            walletsCall.getAllAddresses(walletID)
            break
          }
          case 'transaction': {
            transactionsCall.getAllByKeywords({
              walletID,
              keywords: chain.transactions.keywords,
              pageNo: chain.transactions.pageNo,
              pageSize: chain.transactions.pageSize,
            })
            transactionsCall.get(walletID, chain.transaction.hash)
            break
          }
          case 'wallet': {
            walletsCall.getAll()
            walletsCall.getCurrent()
            break
          }
          case 'network': {
            networksCall.getAll()
            networksCall.currentID()
            break
          }
          default: {
            walletsCall.getCurrent()
            walletsCall.getAll()
            walletsCall.getAllAddresses(walletID)
            networksCall.currentID()
            networksCall.getAll()
            transactionsCall.getAllByKeywords({
              walletID,
              keywords: chain.transactions.keywords,
              pageNo: chain.transactions.pageNo,
              pageSize: chain.transactions.pageSize,
            })
            transactionsCall.get(walletID, chain.transaction.hash)
            break
          }
        }
      }
    )
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

          currentWalletCache.save(wallet)
          currentNetworkIDCache.save(networkID)
          walletsCache.save(wallets)
          addressesCache.save(addresses)
          networksCache.save(networks)
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
                tipBlockNumber: args.result || '0',
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
            // TODO: verify the wallet id the transactions belong to
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
          case TransactionsMethod.TransactionUpdated: {
            const updatedTransaction: State.Transaction = args.result
            if (
              (!chain.transactions.items.length ||
                updatedTransaction.timestamp === null ||
                +(updatedTransaction.timestamp || updatedTransaction.createdAt) >
                  +(chain.transactions.items[0].timestamp || chain.transactions.items[0].createdAt)) &&
              chain.transactions.pageNo === 1
            ) {
              /**
               * 1. transaction list is empty or the coming transaction is pending or the coming transaction is later than latest transaction in current list
               * 2. the current page number is 1
               */
              const newTransactionItems = [updatedTransaction, ...chain.transactions.items].slice(
                0,
                chain.transactions.pageSize
              )
              dispatch({
                type: NeuronWalletActions.Chain,
                payload: { transactions: { ...chain.transactions, items: newTransactionItems } },
              })
            } else {
              const newTransactionItems = [...chain.transactions.items]
              const idx = newTransactionItems.findIndex(item => item.hash === updatedTransaction.hash)
              if (idx >= 0) {
                newTransactionItems[idx] = updatedTransaction
                dispatch({
                  type: NeuronWalletActions.Chain,
                  payload: { transactions: { ...chain.transactions, items: newTransactionItems } },
                })
              }
            }
            if (chain.transaction.hash === updatedTransaction.hash) {
              dispatch({
                type: NeuronWalletActions.Chain,
                payload: { transaction: updatedTransaction },
              })
            }
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
            history.push(Routes.Overview)
            break
          }
          case WalletsMethod.GetAll: {
            dispatch({
              type: NeuronWalletActions.Settings,
              payload: { wallets: args.result },
            })
            walletsCache.save(args.result)
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
            currentWalletCache.save(args.result)
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
            addressesCache.save(addresses)
            break
          }
          case WalletsMethod.RequestPassword: {
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: args.result.walletID || '',
                actionType: args.result.actionType || '',
              },
            })
            break
          }
          default: {
            break
          }
        }
      } else {
        if (!args.msg) {
          return
        }
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
              payload: { networks: args.result || [] },
            })
            networksCache.save(args.result || [])
            break
          }
          case NetworksMethod.CurrentID: {
            dispatch({
              type: NeuronWalletActions.Chain,
              payload: { networkID: args.result },
            })
            currentNetworkIDCache.save(args.result)
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
  }, [walletID, i18n, chain, dispatch, history])

export const useSyncTipBlockNumber = ({
  networks,
  networkID,
  dispatch,
}: {
  networks: State.Network[]
  networkID: string
  dispatch: StateDispatch
}) => {
  useEffect(() => {
    const network = networks.find(n => n.id === networkID)
    const syncTipNumber = () =>
      getTipBlockNumber()
        .then(tipBlockNumber => {
          dispatch({
            type: AppActions.UpdateTipBlockNumber,
            payload: tipBlockNumber,
          })
        })
        .catch(console.error)
    clearInterval(timer)
    if (network) {
      ckbCore.setNode(network.remote)
      syncTipNumber()
      timer = setInterval(() => {
        syncTipNumber()
      }, SYNC_INTERVAL_TIME)
    } else {
      ckbCore.setNode('')
    }
    return () => {
      clearInterval(timer)
    }
  }, [networks, networkID, dispatch])
}

export const useOnCurrentWalletChange = ({ walletID, chain }: { walletID: string; chain: State.Chain }) => {
  useEffect(() => {
    walletsCall.getAllAddresses(walletID)
    transactionsCall.getAllByKeywords({
      walletID,
      keywords: chain.transactions.keywords,
      pageNo: chain.transactions.pageNo,
      pageSize: chain.transactions.pageSize,
    })
    transactionsCall.get(walletID, chain.transaction.hash)
  }, [
    walletID,
    chain.transactions.pageNo,
    chain.transactions.pageSize,
    chain.transactions.keywords,
    chain.transaction.hash,
  ])
}

export default {
  useChannelListeners,
  useSyncTipBlockNumber,
  useOnCurrentWalletChange,
}
