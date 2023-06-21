import { useEffect } from 'react'
import { useLocation, NavigateFunction } from 'react-router-dom'
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
  SyncState as SyncStateSubject,
  Command as CommandSubject,
} from 'services/subjects'
import { ckbCore, getTipHeader } from 'services/chain'
import { networks as networksCache, currentNetworkID as currentNetworkIDCache } from 'services/localCache'
import { WalletWizardPath } from 'components/WalletWizard'
import { ErrorCode, RoutePath, getConnectionStatus } from 'utils'

const SYNC_INTERVAL_TIME = 4000
const CONNECTING_BUFFER = 15_000
let CONNECTING_DEADLINE = Date.now() + CONNECTING_BUFFER

const isCurrentUrl = (url: string) => {
  const id = currentNetworkIDCache.load()
  const list = networksCache.load()
  const cached = list.find(n => n.id === id)?.remote
  return cached === url
}

export const useSyncChainData = ({ chainURL, dispatch }: { chainURL: string; dispatch: StateDispatch }) => {
  useEffect(() => {
    let timer: NodeJS.Timeout
    const syncBlockchainInfo = () => {
      getTipHeader()
        .then(header => {
          if (isCurrentUrl(chainURL)) {
            dispatch({
              type: AppActions.UpdateChainInfo,
              payload: {
                tipBlockNumber: `${BigInt(header.number)}`,
                tipDao: header.dao,
                tipBlockTimestamp: +header.timestamp,
                epoch: header.epoch,
              },
            })

            dispatch({
              type: AppActions.ClearNotificationsOfCode,
              payload: ErrorCode.NodeDisconnected,
            })
          }
        })
        .catch(() => {
          // ignore, unconnected events are handled in subscription
        })
    }
    clearInterval(timer!)
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
  navigate,
  dispatch,
}: {
  walletID: string
  chain: State.Chain
  navigate: NavigateFunction
  dispatch: StateDispatch
}) => {
  useEffect(() => {
    initAppState()(dispatch, navigate)
  }, [walletID, dispatch])
}

export const useSubscription = ({
  walletID,
  chain,
  isAllowedToFetchList,
  navigate,
  dispatch,
  location,
}: {
  walletID: string
  chain: State.Chain
  isAllowedToFetchList: boolean
  navigate: NavigateFunction
  location: ReturnType<typeof useLocation>
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
          updateAddressListAndBalance(walletID)(dispatch)
          updateTransactionList({ walletID, keywords, pageNo, pageSize })(dispatch)
          break
        }
        case 'current-wallet': {
          updateCurrentWallet()(dispatch).then(hasCurrent => {
            if (!hasCurrent) {
              navigate(`${RoutePath.WalletWizard}${WalletWizardPath.Welcome}`)
            }
          })
          break
        }
        case 'wallets': {
          Promise.all([updateWalletList, updateCurrentWallet].map(request => request()(dispatch))).then(
            ([hasList, hasCurrent]) => {
              if (!hasList || !hasCurrent) {
                navigate(`${RoutePath.WalletWizard}${WalletWizardPath.Welcome}`)
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
      CONNECTING_DEADLINE = Date.now() + CONNECTING_BUFFER
      currentNetworkIDCache.save(currentNetworkID)
    })
    const connectionStatusSubscription = ConnectionStatusSubject.subscribe(status => {
      if (isCurrentUrl(status.url)) {
        dispatch({
          type: NeuronWalletActions.UpdateConnectionStatus,
          payload: getConnectionStatus({ ...status, isTimeout: Date.now() > CONNECTING_DEADLINE }),
        })
      }
    })

    const syncStateSubscription = SyncStateSubject.subscribe(
      ({
        cacheTipNumber,
        bestKnownBlockNumber,
        bestKnownBlockTimestamp,
        estimate,
        status,
        isLookingValidTarget,
        validTarget,
      }) => {
        dispatch({
          type: NeuronWalletActions.UpdateSyncState,
          payload: {
            cacheTipBlockNumber: cacheTipNumber,
            bestKnownBlockNumber,
            bestKnownBlockTimestamp,
            estimate,
            status,
            isLookingValidTarget,
            validTarget,
          },
        })
      }
    )

    const commandSubscription = CommandSubject.subscribe(({ winID, type, payload }: Subject.CommandMetaInfo) => {
      if (winID && getWinID() === winID) {
        switch (type) {
          // TODO: is this used anymore?
          case 'navigate-to-url':
          case 'import-hardware': {
            if (payload) {
              navigate(payload)
            }
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
          case 'migrate-acp': {
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: payload || '',
                actionType: 'migrate-acp',
              },
            })
            break
          }
          case 'load-transaction-json': {
            if (payload) {
              const { url, json, filePath } = JSON.parse(payload)
              dispatch({
                type: AppActions.UpdateLoadedTransaction,
                payload: {
                  json,
                  filePath,
                },
              })
              navigate(location.pathname + url)
            }
            break
          }
          case 'sign-verify':
            if (!location.pathname.includes('/sign-verify')) {
              navigate(`${location.pathname}/sign-verify?id=${payload}`)
            }
            break
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
      syncStateSubscription.unsubscribe()
      commandSubscription.unsubscribe()
    }
  }, [walletID, pageNo, pageSize, keywords, isAllowedToFetchList, navigate, dispatch, location.pathname])
}

export default {
  useSyncChainData,
  useOnCurrentWalletChange,
  useSubscription,
}
