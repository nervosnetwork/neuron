import { useEffect } from 'react'

import { NeuronWalletActions, StateDispatch, AppActions } from 'states/stateProvider/reducer'
import {
  updateTransactionList,
  updateCurrentWallet,
  updateWalletList,
  updateAddressListAndBalance,
  initAppState,
} from 'states/stateProvider/actionCreators'

import { getWinID } from 'services/remote'
import {
  DataUpdate as DataUpdateSubject,
  NetworkList as NetworkListSubject,
  CurrentNetworkID as CurrentNetworkIDSubject,
  ConnectionStatus as ConnectionStatusSubject,
  SyncedBlockNumber as SyncedBlockNumberSubject,
  AppUpdater as AppUpdaterSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { ckbCore, getBlockchainInfo, getTipHeader } from 'services/chain'
import { networks as networksCache, currentNetworkID as currentNetworkIDCache } from 'services/localCache'
import { WalletWizardPath } from 'components/WalletWizard'
import { ConnectionStatus, ErrorCode, CONNECTING_DEADLINE, Routes } from 'utils/const'

let timer: NodeJS.Timeout
const SYNC_INTERVAL_TIME = 4000

export const useSyncChainData = ({ chainURL, dispatch }: { chainURL: string; dispatch: StateDispatch }) => {
  useEffect(() => {
    const syncBlockchainInfo = () => {
      Promise.all([getTipHeader(), getBlockchainInfo()])
        .then(([header, chainInfo]) => {
          dispatch({
            type: AppActions.UpdateChainInfo,
            payload: {
              tipBlockNumber: `${BigInt(header.number)}`,
              tipBlockHash: header.hash,
              tipBlockTimestamp: +header.timestamp,
              chain: chainInfo.chain,
              difficulty: BigInt(chainInfo.difficulty),
              epoch: chainInfo.epoch,
            },
          })

          dispatch({
            type: AppActions.ClearNotificationsOfCode,
            payload: ErrorCode.NodeDisconnected,
          })
        })
        .catch(() => {
          dispatch({
            type: NeuronWalletActions.UpdateConnectionStatus,
            payload: Date.now() > CONNECTING_DEADLINE ? ConnectionStatus.Offline : ConnectionStatus.Connecting,
          })
        })
    }
    clearInterval(timer)
    if (chainURL) {
      ckbCore.setNode(chainURL)
      syncBlockchainInfo()
      timer = setInterval(() => {
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
  history,
  dispatch,
}: {
  walletID: string
  chain: State.Chain
  history: any

  dispatch: StateDispatch
}) => {
  useEffect(() => {
    console.info(`switching to ${walletID}`)
    initAppState()(dispatch, history)
  }, [walletID, dispatch, history])
}

export const useSubscription = ({
  walletID,
  chain,
  isAllowedToFetchList,
  history,
  dispatch,
}: {
  walletID: string
  chain: State.Chain
  isAllowedToFetchList: boolean
  history: any
  dispatch: StateDispatch
}) => {
  const { pageNo, pageSize, keywords } = chain.transactions
  useEffect(() => {
    const dataUpdateSubscription = DataUpdateSubject.subscribe(({ dataType, walletID: walletIDOfMessage }: any) => {
      if (walletIDOfMessage && walletIDOfMessage !== walletID) {
        return
      }
      switch (dataType) {
        case 'address': {
          if (!isAllowedToFetchList) {
            break
          }
          updateAddressListAndBalance(walletID)(dispatch)
          break
        }
        case 'transaction': {
          if (!isAllowedToFetchList) {
            break
          }
          updateTransactionList({ walletID, keywords, pageNo, pageSize })(dispatch)
          break
        }
        case 'current-wallet': {
          updateCurrentWallet()(dispatch).then(hasCurrent => {
            if (!hasCurrent) {
              history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
            }
          })
          break
        }
        case 'wallets': {
          Promise.all([updateWalletList, updateCurrentWallet].map(request => request()(dispatch))).then(
            ([hasList, hasCurrent]) => {
              if (!hasList || !hasCurrent) {
                history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
              }
            }
          )
          break
        }
        default: {
          break
        }
      }
    })
    const networkListSubscription = NetworkListSubject.subscribe((currentNetworkList = []) => {
      dispatch({
        type: NeuronWalletActions.UpdateNetworkList,
        payload: currentNetworkList,
      })
      networksCache.save(currentNetworkList)
    })
    const currentNetworkIDSubscription = CurrentNetworkIDSubject.subscribe((currentNetworkID = '') => {
      dispatch({
        type: NeuronWalletActions.UpdateCurrentNetworkID,
        payload: currentNetworkID,
      })
      currentNetworkIDCache.save(currentNetworkID)
    })
    const connectionStatusSubscription = ConnectionStatusSubject.subscribe(status => {
      let payload = status ? ConnectionStatus.Online : ConnectionStatus.Offline
      if (payload === ConnectionStatus.Offline && Date.now() <= CONNECTING_DEADLINE) {
        payload = ConnectionStatus.Connecting
      }
      dispatch({
        type: NeuronWalletActions.UpdateConnectionStatus,
        payload,
      })
    })

    const syncedBlockNumberSubscription = SyncedBlockNumberSubject.subscribe(syncedBlockNumber => {
      dispatch({
        type: NeuronWalletActions.UpdateSyncedBlockNumber,
        payload: syncedBlockNumber,
      })
    })

    const appUpdaterSubscription = AppUpdaterSubject.subscribe(appUpdaterInfo => {
      dispatch({
        type: NeuronWalletActions.UpdateAppUpdaterStatus,
        payload: appUpdaterInfo,
      })
    })

    const commandSubscription = CommandSubject.subscribe(({ winID, type, payload }: Subject.CommandMetaInfo) => {
      if (winID && getWinID() === winID) {
        switch (type) {
          case 'navigate-to-url': {
            history.push(payload)
            break
          }
          case 'delete-wallet': {
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: payload || '',
                actionType: 'delete',
              },
            })
            break
          }
          case 'backup-wallet': {
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: payload || '',
                actionType: 'backup',
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
    return () => {
      dataUpdateSubscription.unsubscribe()
      networkListSubscription.unsubscribe()
      currentNetworkIDSubscription.unsubscribe()
      connectionStatusSubscription.unsubscribe()
      syncedBlockNumberSubscription.unsubscribe()
      appUpdaterSubscription.unsubscribe()
      commandSubscription.unsubscribe()
    }
  }, [walletID, pageNo, pageSize, keywords, isAllowedToFetchList, history, dispatch])
}

export default {
  useSyncChainData,
  useOnCurrentWalletChange,
  useSubscription,
}
