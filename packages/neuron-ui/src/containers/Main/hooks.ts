import { useEffect } from 'react'

import { WalletWizardPath } from 'components/WalletWizard'
import { NeuronWalletActions, StateDispatch, AppActions } from 'states/stateProvider/reducer'
import { toggleAddressBook, updateTransactionList, updateTransaction } from 'states/stateProvider/actionCreators'

import UILayer, { WalletsMethod, walletsCall } from 'services/UILayer'
import { initWindow, getWinID } from 'services/remote'
import {
  SystemScript as SystemScriptSubject,
  DataUpdate as DataUpdateSubject,
  NetworkList as NetworkListSubject,
  CurrentNetworkID as CurrentNetworkIDSubject,
  ConnectionStatus as ConnectionStatusSubject,
  SyncedBlockNumber as SyncedBlockNumberSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { ckbCore, getTipBlockNumber, getBlockchainInfo } from 'services/chain'
import { Routes, Channel, ConnectionStatus } from 'utils/const'
import {
  wallets as walletsCache,
  networks as networksCache,
  addresses as addressesCache,
  currentNetworkID as currentNetworkIDCache,
  currentWallet as currentWalletCache,
  systemScript as systemScriptCache,
} from 'utils/localCache'
import addressesToBalance from 'utils/addressesToBalance'
import initializeApp from 'utils/initializeApp'

let timer: NodeJS.Timeout
const SYNC_INTERVAL_TIME = 10000

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
          case WalletsMethod.GetAllAddresses: {
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
  }, [walletID, i18n, chain, dispatch, history])

export const useSyncChainData = ({ chainURL, dispatch }: { chainURL: string; dispatch: StateDispatch }) => {
  useEffect(() => {
    const syncTipNumber = () =>
      getTipBlockNumber()
        .then(tipBlockNumber => {
          dispatch({
            type: AppActions.UpdateTipBlockNumber,
            payload: tipBlockNumber,
          })
        })
        .catch(console.error)

    const syncBlockchainInfo = () => {
      getBlockchainInfo()
        .then(info => {
          if (info) {
            const { chain = '', difficulty = '', epoch = '', alerts = [] } = info
            if (alerts.length) {
              alerts.forEach(a => {
                // TODO: display alerts in Notification
                console.info(a)
              })
            }
            dispatch({
              type: AppActions.UpdateChainInfo,
              payload: {
                chain,
                difficulty,
                epoch,
              },
            })
          }
        })
        .catch(console.error)
    }
    clearInterval(timer)
    if (chainURL) {
      ckbCore.setNode(chainURL)
      syncTipNumber()
      syncBlockchainInfo()
      timer = setInterval(() => {
        syncTipNumber()
        syncBlockchainInfo()
      }, SYNC_INTERVAL_TIME)
    } else {
      ckbCore.setNode('')
    }
    return () => {
      clearInterval(timer)
    }
  }, [chainURL, dispatch])
}

export const useOnCurrentWalletChange = ({
  walletID,
  chain,
  i18n,
  history,
  dispatch,
}: {
  walletID: string
  chain: State.Chain
  i18n: any
  history: any

  dispatch: StateDispatch
}) => {
  const { pageNo, pageSize } = chain.transactions
  useEffect(() => {
    if (walletID) {
      walletsCall.getAllAddresses(walletID)
      updateTransactionList({
        walletID,
        keywords: '',
        pageNo,
        pageSize,
      })(dispatch)
    } else {
      initWindow()
        .then((initializedState: any) => {
          initializeApp({
            initializedState,
            i18n,
            history,
            dispatch,
          })
        })
        .catch((err: Error) => {
          console.error(err)
          history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
        })
    }
  }, [walletID, pageNo, pageSize, dispatch, i18n, history])
}

export const useSubscription = ({
  walletID,
  chain,
  history,
  dispatch,
}: {
  walletID: string
  chain: State.Chain
  history: any
  dispatch: StateDispatch
}) => {
  const { pageNo, pageSize, keywords } = chain.transactions
  const { hash: txHash } = chain.transaction
  useEffect(() => {
    const systemScriptSubscription = SystemScriptSubject.subscribe(({ codeHash = '' }: { codeHash: string }) => {
      systemScriptCache.save({ codeHash })
      dispatch({
        type: NeuronWalletActions.UpdateCodeHash,
        payload: codeHash,
      })
    })
    const dataUpdateSubscription = DataUpdateSubject.subscribe(({ dataType, walletID: walletIDOfMessage }: any) => {
      if (walletIDOfMessage && walletIDOfMessage !== walletID) {
        return
      }
      switch (dataType) {
        case 'address': {
          walletsCall.getAllAddresses(walletID)
          break
        }
        case 'transaction': {
          updateTransactionList({
            walletID,
            keywords,
            pageNo,
            pageSize,
          })(dispatch)
          updateTransaction({ walletID, hash: txHash })
          break
        }
        case 'wallet': {
          walletsCall.getAll()
          walletsCall.getCurrent()
          break
        }
        default: {
          break
        }
      }
    })
    const networkListSubscription = NetworkListSubject.subscribe(({ currentNetworkList = [] }) => {
      dispatch({
        type: NeuronWalletActions.UpdateNetworkList,
        payload: currentNetworkList,
      })
      networksCache.save(currentNetworkList)
    })
    const currentNetworkIDSubscription = CurrentNetworkIDSubject.subscribe(({ currentNetworkID = '' }) => {
      dispatch({
        type: NeuronWalletActions.UpdateCurrentNetworkID,
        payload: currentNetworkID,
      })
      currentNetworkIDCache.save(currentNetworkID)
    })
    const connectionStatusSubscription = ConnectionStatusSubject.subscribe(status => {
      dispatch({
        type: NeuronWalletActions.UpdateConnectionStatus,
        payload: status ? ConnectionStatus.Online : ConnectionStatus.Offline,
      })
    })

    const syncedBlockNumberSubscription = SyncedBlockNumberSubject.subscribe(syncedBlockNumber => {
      dispatch({
        type: NeuronWalletActions.UpdateSyncedBlockNumber,
        payload: syncedBlockNumber,
      })
    })
    const commandSubscription = CommandSubject.subscribe(
      ({ winID, type, payload }: { winID: number; type: 'nav' | 'toggleAddressBook'; payload: string | null }) => {
        if (getWinID() === winID) {
          switch (type) {
            case 'nav': {
              history.push(payload)
              break
            }
            case 'toggleAddressBook': {
              dispatch(toggleAddressBook())
              break
            }
            default: {
              break
            }
          }
        }
      }
    )
    return () => {
      systemScriptSubscription.unsubscribe()
      dataUpdateSubscription.unsubscribe()
      networkListSubscription.unsubscribe()
      currentNetworkIDSubscription.unsubscribe()
      connectionStatusSubscription.unsubscribe()
      syncedBlockNumberSubscription.unsubscribe()
      commandSubscription.unsubscribe()
    }
  }, [walletID, pageNo, pageSize, keywords, txHash, history, dispatch])
}

export default {
  useChannelListeners,
  useSyncChainData,
  useOnCurrentWalletChange,
  useSubscription,
}
