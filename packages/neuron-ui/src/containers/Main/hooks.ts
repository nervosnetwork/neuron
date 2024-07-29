import { useEffect, useCallback, useState } from 'react'
import { useLocation, NavigateFunction, useNavigate } from 'react-router-dom'
import type { TFunction } from 'i18next'
import { NeuronWalletActions, StateDispatch, AppActions } from 'states/stateProvider/reducer'
import {
  updateTransactionList,
  updateCurrentWallet,
  updateWalletList,
  updateAddressListAndBalance,
  initAppState,
  showGlobalAlertDialog,
  updateLockWindowInfo,
  dismissGlobalAlertDialog,
} from 'states/stateProvider/actionCreators'

import {
  getCkbNodeDataPath,
  getCurrentWallet,
  getWinID,
  setCurrentNetwork,
  startNodeIgnoreExternal,
  startSync,
  replaceWallet,
} from 'services/remote'
import {
  DataUpdate as DataUpdateSubject,
  NetworkList as NetworkListSubject,
  CurrentNetworkID as CurrentNetworkIDSubject,
  ConnectionStatus as ConnectionStatusSubject,
  SyncState as SyncStateSubject,
  Command as CommandSubject,
  ShowGlobalDialog as ShowGlobalDialogSubject,
  NoDiskSpace,
} from 'services/subjects'
import { rpc, getTipHeader } from 'services/chain'
import {
  networks as networksCache,
  currentNetworkID as currentNetworkIDCache,
  importedWalletDialogShown,
} from 'services/localCache'
import { WalletWizardPath } from 'components/WalletWizard'
import { ErrorCode, RoutePath, getConnectionStatus, isSuccessResponse } from 'utils'

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
      rpc.setNode({ url: chainURL })
      syncBlockchainInfo()
      timer = setInterval(() => {
        syncBlockchainInfo()
      }, SYNC_INTERVAL_TIME)
    } else {
      rpc.setNode({ url: '' })
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
  showSwitchNetwork,
  lockWindowInfo,
  setIsLockDialogShow,
  t,
}: {
  walletID: string
  chain: State.Chain
  isAllowedToFetchList: boolean
  navigate: NavigateFunction
  location: ReturnType<typeof useLocation>
  dispatch: StateDispatch
  showSwitchNetwork: () => void
  lockWindowInfo: State.App['lockWindowInfo']
  setIsLockDialogShow: (v: boolean) => void
  t: TFunction
}) => {
  const { pageNo, pageSize, keywords } = chain.transactions

  const navigateToolsRouter = useCallback(
    (path: string) => {
      const { pathname } = location
      const currentPath = [RoutePath.OfflineSign, RoutePath.SignVerify, RoutePath.MultisigAddress].find(item =>
        pathname.includes(item)
      )
      if (currentPath) {
        navigate(location.pathname.replace(currentPath, path))
      } else {
        navigate(`${location.pathname}/${path}`)
      }
    },
    [navigate, location]
  )

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
        case 'new-xpubkey-wallet': {
          getCurrentWallet().then(res => {
            if (isSuccessResponse(res) && res.result) {
              importedWalletDialogShown.setStatus(res.result.id, true)
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
      updateAddressListAndBalance(walletID)(dispatch)
    })
    const connectionStatusSubscription = ConnectionStatusSubject.subscribe(status => {
      if (isCurrentUrl(status.url)) {
        dispatch({
          type: NeuronWalletActions.UpdateConnectionStatus,
          payload: getConnectionStatus({ ...status, isTimeout: Date.now() > CONNECTING_DEADLINE }),
        })
        if (status.connected && status.isBundledNode && !status.startedBundledNode) {
          showSwitchNetwork()
        }
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
              navigateToolsRouter(url)
            }
            break
          }
          case 'sign-verify':
          case 'multisig-address':
            navigateToolsRouter(type)
            break
          case 'lock-window':
            if (lockWindowInfo?.encryptedPassword) {
              if (!lockWindowInfo.locked) {
                updateLockWindowInfo({ locked: true })(dispatch)
              }
            } else {
              setIsLockDialogShow(true)
            }
            break
          case 'import-exist-xpubkey': {
            if (payload) {
              const { existWalletIsWatchOnly, existingWalletId, id: importedWalletId } = JSON.parse(payload)
              if (existWalletIsWatchOnly) {
                showGlobalAlertDialog({
                  type: 'warning',
                  message: t('main.import-exist-xpubkey-dialog.replace-tip'),
                  action: 'all',
                  onOk: () => {
                    replaceWallet({
                      existingWalletId,
                      importedWalletId,
                    }).then(res => {
                      if (isSuccessResponse(res)) {
                        dismissGlobalAlertDialog()(dispatch)
                        navigate(RoutePath.Overview)
                      }
                    })
                  },
                })(dispatch)
              } else {
                showGlobalAlertDialog({
                  type: 'warning',
                  message: t('main.import-exist-xpubkey-dialog.delete-tip'),
                  action: 'ok',
                })(dispatch)
              }
            }
            break
          }
          default: {
            break
          }
        }
      }
    })
    const showGlobalDialogSubject = ShowGlobalDialogSubject.subscribe(params => {
      showGlobalAlertDialog(params)(dispatch)
    })
    return () => {
      dataUpdateSubscription.unsubscribe()
      networkListSubscription.unsubscribe()
      currentNetworkIDSubscription.unsubscribe()
      connectionStatusSubscription.unsubscribe()
      syncStateSubscription.unsubscribe()
      commandSubscription.unsubscribe()
      showGlobalDialogSubject.unsubscribe()
    }
  }, [
    walletID,
    pageNo,
    pageSize,
    keywords,
    isAllowedToFetchList,
    navigate,
    dispatch,
    location.pathname,
    showSwitchNetwork,
    lockWindowInfo,
    setIsLockDialogShow,
  ])
}

export const useNoDiskSpace = (navigate: NavigateFunction) => {
  const [isNoDiskSpaceDialogShow, setIsNoDiskSpaceDialogShow] = useState(false)
  const [isMigrateDataDialogShow, setIsMigrateDataDialogShow] = useState(false)
  const [oldCkbDataPath, setOldCkbDataPath] = useState('')
  const [newCkbDataPath, setNewCkbDataPath] = useState('')
  useEffect(() => {
    const noDiskSpaceSubject = NoDiskSpace.subscribe(params => {
      navigate(RoutePath.Overview)
      setIsNoDiskSpaceDialogShow(params)
      getCkbNodeDataPath().then(res => {
        if (isSuccessResponse(res)) {
          setOldCkbDataPath(res.result!)
        }
      })
    })
    return () => {
      noDiskSpaceSubject.unsubscribe()
    }
  }, [navigate])
  const onConfirm = useCallback(() => {
    startSync().then(res => {
      if (isSuccessResponse(res)) {
        setIsNoDiskSpaceDialogShow(false)
      }
    })
  }, [])
  const onMigrate = useCallback(() => {
    setIsMigrateDataDialogShow(true)
  }, [])
  const onConfirmMigrate = useCallback((dataPath: string) => {
    setIsMigrateDataDialogShow(false)
    setIsNoDiskSpaceDialogShow(false)
    setOldCkbDataPath(dataPath)
  }, [])
  return {
    isNoDiskSpaceDialogShow,
    setNewCkbDataPath,
    oldCkbDataPath,
    newCkbDataPath,
    onCancel: useCallback(() => {
      setIsNoDiskSpaceDialogShow(false)
    }, []),
    onConfirm,
    isMigrateDataDialogShow,
    onMigrate,
    onCloseMigrateDialog: useCallback(() => {
      setIsMigrateDataDialogShow(false)
    }, []),
    onConfirmMigrate,
  }
}

export const useCheckNode = (networks: State.Network[], networkID: string) => {
  const [isSwitchNetworkShow, setIsSwitchNetworkShow] = useState<boolean>(false)
  const [selectNetwork, setSelectNetwork] = useState(networks[0]?.id)
  useEffect(() => {
    if (isSwitchNetworkShow) {
      setSelectNetwork(networks[0]?.id)
    }
  }, [networks, isSwitchNetworkShow])
  const [showEditorDialog, setShowEditorDialog] = useState(false)
  const onConfirm = useCallback(() => {
    if (selectNetwork) {
      setCurrentNetwork(selectNetwork)
      setIsSwitchNetworkShow(false)
    }
  }, [selectNetwork])
  const onCloseEditorDialog = useCallback(() => {
    setShowEditorDialog(false)
  }, [])
  const onOpenEditorDialog = useCallback(() => {
    setShowEditorDialog(true)
  }, [])
  const navigate = useNavigate()
  const [networkIdWhenDialogShow, setNetworkIdWhenDialogShow] = useState<undefined | string>()
  useEffect(() => {
    setNetworkIdWhenDialogShow(undefined)
  }, [networkID])
  const showSwitchNetwork = useCallback(() => {
    // if the use has not change network id, the dialog will only show once
    if (networkIdWhenDialogShow !== networkID) {
      setNetworkIdWhenDialogShow(networkID)
      navigate(RoutePath.Settings)
      setIsSwitchNetworkShow(true)
    }
  }, [networkID, networkIdWhenDialogShow])
  return {
    selectNetwork,
    onChangeSelected: setSelectNetwork,
    isSwitchNetworkShow,
    showSwitchNetwork,
    onCancel: useCallback(() => {
      setIsSwitchNetworkShow(false)
      startNodeIgnoreExternal()
    }, []),
    onConfirm,
    showEditorDialog,
    onCloseEditorDialog,
    onOpenEditorDialog,
  }
}

export default {
  useSyncChainData,
  useOnCurrentWalletChange,
  useSubscription,
}
