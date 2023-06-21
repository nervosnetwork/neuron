import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import Pagination from 'widgets/Pagination'
import SpecialAsset, { AssetInfo } from 'components/SpecialAsset'
import Experimental from 'widgets/ExperimentalRibbon'
import {
  unlockSpecialAsset,
  getSpecialAssets,
  generateWithdrawChequeTransaction,
  generateClaimChequeTransaction,
} from 'services/remote'
import {
  CONSTANTS,
  RoutePath,
  isMainnet as isMainnetUtil,
  isSuccessResponse,
  listParams,
  useFetchTokenInfoList,
  PresetScript,
  nftFormatter,
} from 'utils'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import SUDTUpdateDialog, { SUDTUpdateDialogProps } from 'components/SUDTUpdateDialog'
import { TokenInfo } from 'components/SUDTCreateDialog'
import SUDTMigrateDialog from 'components/SUDTMigrateDialog'
import SUDTMigrateToNewAccountDialog from 'components/SUDTMigrateToNewAccountDialog'
import SUDTMigrateToExistAccountDialog from 'components/SUDTMigrateToExistAccountDialog'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import { LIGHT_NETWORK_TYPE } from 'utils/const'
import {
  useMigrate,
  useClickMigrate,
  useMigrateToNewAccount,
  useMigrateToExistAccount,
  useGetAssetAccounts,
} from './hooks'
import styles from './specialAssetList.module.scss'

const { PAGE_SIZE } = CONSTANTS

export interface SpecialAssetCell {
  blockHash: string
  blockNumber: string
  capacity: string
  customizedAssetInfo: AssetInfo
  daoData: string | null
  data: string
  lock: {
    args: string
    codeHash: string
    hashType: 'type' | 'data'
  }
  lockHash: string
  multiSignBlake160: string
  outPoint: {
    index: string
    txHash: string
  }
  status: 'live' | 'dead'
  timestamp: string
  type: CKBComponents.Script | null
}

const SpecialAssetList = () => {
  const [t] = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [cells, setCells] = useState<SpecialAssetCell[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const navigate = useNavigate()
  const [pageNo, setPageNo] = useState<number>(1)
  const { search } = useLocation()
  const dispatch = useDispatch()
  const tokenInfoList = useFetchTokenInfoList()
  const [accountToClaim, setAccountToClaim] = useState<{
    account: Controller.GenerateClaimChequeTransaction.AssetAccount
    tx: any
  } | null>(null)
  const [migrateCell, setMigrateCell] = useState<SpecialAssetCell | undefined>()
  const [migrateTokenInfo, setMigrateTokenInfo] = useState<Controller.GetTokenInfoList.TokenInfo | undefined>()
  const { dialogRef, openDialog, closeDialog } = useMigrate()
  const {
    dialogRef: newAccountDialog,
    openDialog: openNewAccount,
    closeDialog: closeNewAccount,
  } = useMigrateToNewAccount()
  const {
    dialogRef: existAccountDialog,
    openDialog: openExistAccount,
    closeDialog: closeExistAccount,
  } = useMigrateToExistAccount()
  const onClickMigrate = useClickMigrate({
    closeMigrateDialog: closeDialog,
    openMigrateToNewAccountDialog: openNewAccount,
    openMigrateToExistAccountDialog: openExistAccount,
  })
  const onCloseDialog = useCallback(() => {
    closeExistAccount()
    closeNewAccount()
    setMigrateCell(undefined)
  }, [closeNewAccount, closeExistAccount, setMigrateCell])

  const {
    app: { epoch, globalDialog },
    wallet: { id },
    settings: { networks },
    chain: {
      networkID,
      connectionStatus,
      syncState: { bestKnownBlockTimestamp },
    },
    sUDTAccounts,
  } = useGlobalState()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const isMainnet = isMainnetUtil(networks, networkID)
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === LIGHT_NETWORK_TYPE,
    [networkID, networks]
  )
  const foundTokenInfo = tokenInfoList.find(token => token.tokenID === accountToClaim?.account.tokenID)
  const accountNames = useMemo(() => sUDTAccounts.filter(v => !!v.accountName).map(v => v.accountName!), [sUDTAccounts])
  const updateAccountDialogProps: SUDTUpdateDialogProps | undefined = accountToClaim?.account
    ? {
        ...accountToClaim.account,
        isMainnet,
        accountId: '',
        tokenId: accountToClaim.account.tokenID,
        accountName: '',
        tokenName: (accountToClaim.account.tokenName || foundTokenInfo?.tokenName) ?? '',
        symbol: (accountToClaim.account.symbol || foundTokenInfo?.symbol) ?? '',
        decimal: (accountToClaim.account.decimal || foundTokenInfo?.decimal) ?? '',
        isCKB: false,
        onSubmit: (info: Omit<TokenInfo, 'isCKB' | 'id'>) => {
          const params: any = accountToClaim?.account || {}
          Object.keys(info).forEach(key => {
            if (
              info[key as keyof typeof info] !==
              accountToClaim?.account[key as keyof Controller.GenerateClaimChequeTransaction.AssetAccount]
            ) {
              params[key] = info[key as keyof typeof info]
            }
          })
          dispatch({
            type: AppActions.UpdateExperimentalParams,
            payload: { tx: accountToClaim.tx, assetAccount: params },
          })
          dispatch({
            type: AppActions.RequestPassword,
            payload: { walletID: id, actionType: 'create-account-to-claim-cheque' },
          })
          setAccountToClaim(null)
          return Promise.resolve(true)
        },
        onCancel: () => {
          setAccountToClaim(null)
        },
        existingAccountNames: accountNames.filter(name => name !== accountToClaim.account.accountName),
      }
    : undefined

  useGetAssetAccounts(id)

  useEffect(() => {
    dispatch({ type: AppActions.ClearSendState })
  }, [dispatch])

  const fetchList = useCallback(
    (walletID: string, pageNum: number) => {
      getSpecialAssets({
        walletID,
        pageNo: pageNum,
        pageSize: PAGE_SIZE,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            const { items, totalCount: count } = res.result as { items: SpecialAssetCell[]; totalCount: string }
            setCells(items)
            setTotalCount(+count)
          } else {
            dispatch({
              type: AppActions.AddNotification,
              payload: {
                type: 'alert',
                timestamp: +new Date(),
                content: typeof res.message === 'string' ? res.message : res.message.content!,
              },
            })
          }
        })
        .then(() => {
          setLoaded(true)
        })
    },
    [dispatch, setCells, setTotalCount]
  )

  useEffect(() => {
    const { pageNo: no } = listParams(search)

    setPageNo(no)
    fetchList(id, no)
  }, [search, id, dispatch, fetchList])

  useEffect(() => {
    if (globalDialog === 'unlock-success') {
      fetchList(id, pageNo)
    }
  }, [globalDialog, fetchList, id, pageNo])

  const handleAction = useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { txHash, idx },
      } = e.target
      const cell = cells.find(c => c.outPoint.txHash === txHash && c.outPoint.index === idx)
      if (!cell) {
        dispatch({
          type: AppActions.AddNotification,
          payload: { type: 'alert', timestamp: +new Date(), content: 'Cannot find the cell' },
        })
        return
      }
      if (cell.customizedAssetInfo.type === 'NFT') {
        navigate(`${RoutePath.NFTSend}/${nftFormatter(cell.type?.args, true)}`, {
          state: {
            outPoint: cell.outPoint,
          },
        })
        return
      }
      const handleRes =
        (actionType: 'unlock' | 'withdraw-cheque' | 'claim-cheque') => (res: ControllerResponse<any>) => {
          if (isSuccessResponse(res)) {
            if (actionType === 'unlock') {
              dispatch({ type: AppActions.UpdateGeneratedTx, payload: res.result })
            } else {
              dispatch({ type: AppActions.UpdateExperimentalParams, payload: res.result })
            }
            dispatch({ type: AppActions.RequestPassword, payload: { walletID: id, actionType } })
          } else {
            dispatch({
              type: AppActions.AddNotification,
              payload: {
                type: 'alert',
                timestamp: +new Date(),
                content: typeof res.message === 'string' ? res.message : res.message.content!,
              },
            })
          }
        }
      switch (cell.customizedAssetInfo.lock) {
        case PresetScript.Locktime: {
          unlockSpecialAsset({
            walletID: id,
            outPoint: cell.outPoint,
            feeRate: `${suggestFeeRate}`,
            customizedAssetInfo: cell.customizedAssetInfo,
          }).then(handleRes('unlock'))
          return
        }
        case PresetScript.Cheque: {
          if (cell.customizedAssetInfo.data === 'claimable') {
            generateClaimChequeTransaction({ walletID: id, chequeCellOutPoint: cell.outPoint }).then(res => {
              if (isSuccessResponse(res)) {
                if (!res.result!.assetAccount) {
                  handleRes('claim-cheque')(res)
                } else {
                  setAccountToClaim({
                    account: res!.result!.assetAccount,
                    tx: res!.result!.tx,
                  })
                }
              } else {
                dispatch({
                  type: AppActions.AddNotification,
                  payload: {
                    type: 'alert',
                    timestamp: +new Date(),
                    content: typeof res.message === 'string' ? res.message : res.message.content!,
                  },
                })
              }
            })
          } else {
            generateWithdrawChequeTransaction({ walletID: id, chequeCellOutPoint: cell.outPoint }).then(
              handleRes('withdraw-cheque')
            )
          }
          break
        }
        case PresetScript.SUDT: {
          openDialog()
          setMigrateCell(cell)
          const findTokenInfo = tokenInfoList.find(info => info.tokenID === cell.type?.args)
          setMigrateTokenInfo(findTokenInfo)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [cells, id, dispatch, setAccountToClaim, navigate, openDialog, tokenInfoList]
  )

  const list = useMemo(() => {
    return cells.map(({ outPoint, timestamp, customizedAssetInfo, data, lock, type, capacity }) => {
      return (
        <SpecialAsset
          key={`${outPoint.txHash}-${outPoint.index}`}
          datetime={+timestamp}
          isMainnet={isMainnet}
          cell={{ outPoint, capacity, data, lock, type }}
          assetInfo={customizedAssetInfo}
          epoch={epoch}
          onAction={handleAction}
          connectionStatus={connectionStatus}
          bestKnownBlockTimestamp={bestKnownBlockTimestamp}
          tokenInfoList={tokenInfoList}
        />
      )
    })
  }, [cells, epoch, isMainnet, handleAction, connectionStatus, bestKnownBlockTimestamp, tokenInfoList])

  return (
    <div className={styles.container}>
      <Experimental tag="customized-assset" />
      <div className={styles.title}>{t('special-assets.title')}</div>
      {totalCount ? (
        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <span>{t('special-assets.date')}</span>
            <span>{t('special-assets.assets')}</span>
          </div>
          {list}
        </div>
      ) : null}
      {totalCount || !loaded ? null : <div className={styles.noItems}>{t('special-assets.no-special-assets')}</div>}

      <div className={styles.pagination}>
        {totalCount ? (
          <Pagination
            pageNo={pageNo}
            count={totalCount}
            pageSize={PAGE_SIZE}
            onChange={(idx: number) => {
              navigate(`${RoutePath.SpecialAssets}?pageNo=${idx}`)
            }}
          />
        ) : null}
      </div>
      {updateAccountDialogProps ? <SUDTUpdateDialog {...updateAccountDialogProps} /> : null}
      {migrateCell && (
        <dialog className={styles.migrateSelectDialog} ref={dialogRef}>
          <SUDTMigrateDialog cell={migrateCell} openDialog={onClickMigrate} />
        </dialog>
      )}
      {migrateCell && (
        <dialog className={styles.dialog} ref={newAccountDialog}>
          <SUDTMigrateToNewAccountDialog
            cell={migrateCell}
            closeDialog={onCloseDialog}
            sUDTAccounts={sUDTAccounts}
            walletID={id}
            tokenInfo={migrateTokenInfo}
          />
        </dialog>
      )}
      {migrateCell && (
        <dialog className={styles.dialog} ref={existAccountDialog}>
          <SUDTMigrateToExistAccountDialog
            cell={migrateCell}
            closeDialog={onCloseDialog}
            tokenInfo={migrateTokenInfo}
            sUDTAccounts={sUDTAccounts}
            isMainnet={isMainnet}
            walletID={id}
            isLightClient={isLightClient}
          />
        </dialog>
      )}
    </div>
  )
}

SpecialAssetList.displayName = 'SpecialAssetList'

export default SpecialAssetList
