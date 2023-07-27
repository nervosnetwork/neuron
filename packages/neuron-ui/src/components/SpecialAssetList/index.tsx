import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import Pagination from 'widgets/Pagination'
import Table from 'widgets/Table'
import Button from 'widgets/Button'
import {
  unlockSpecialAsset,
  getSpecialAssets,
  generateWithdrawChequeTransaction,
  generateClaimChequeTransaction,
  openExternal,
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
  uniformTimeFormatter,
  getExplorerUrl,
  ConnectionStatus,
} from 'utils'
import { LIGHT_NETWORK_TYPE, HIDE_BALANCE } from 'utils/const'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import SUDTUpdateDialog, { SUDTUpdateDialogProps } from 'components/SUDTUpdateDialog'
import { TokenInfo } from 'components/SUDTCreateDialog'
import SUDTMigrateDialog from 'components/SUDTMigrateDialog'
import SUDTMigrateToNewAccountDialog from 'components/SUDTMigrateToNewAccountDialog'
import SUDTMigrateToExistAccountDialog from 'components/SUDTMigrateToExistAccountDialog'
import PageContainer from 'components/PageContainer'
import NFTSend from 'components/NFTSend'
import { useGetAssetAccounts, useGetSpecialAssetColumnInfo } from './hooks'

import styles from './specialAssetList.module.scss'

export interface LocktimeAssetInfo {
  data: string
  lock: PresetScript.Locktime
  type: string
}

export interface ChequeAssetInfo {
  data: 'claimable' | 'withdraw-able'
  lock: PresetScript.Cheque
  type: string
}

export enum NFTType {
  NFT = 'NFT',
  NFTClass = 'NFTClass',
  NFTIssuer = 'NFTIssuer',
}

export interface NFTAssetInfo {
  data: string
  lock: string
  type: NFTType
}

type UnknownAssetInfo = Record<'data' | 'lock' | 'type', string>

export type AssetInfo = LocktimeAssetInfo | ChequeAssetInfo | UnknownAssetInfo | NFTAssetInfo

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
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState<boolean>(false)
  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState<boolean>(false)
  const [isExistAccountDialogOpen, setIsExistAccountDialogOpen] = useState<boolean>(false)
  const [nFTSendCell, setNFTSendCell] = useState<
    | {
        nftId: string
        outPoint: {
          index: string
          txHash: string
        }
      }
    | undefined
  >()
  const [migrateTokenInfo, setMigrateTokenInfo] = useState<Controller.GetTokenInfoList.TokenInfo | undefined>()

  const onClickMigrate = useCallback(
    (type: string) => {
      setIsMigrateDialogOpen(false)
      switch (type) {
        case 'new-account':
          setIsNewAccountDialogOpen(true)
          break
        case 'exist-account':
          setIsExistAccountDialogOpen(true)
          break
        default:
          break
      }
    },
    [setIsMigrateDialogOpen, setIsNewAccountDialogOpen, setIsExistAccountDialogOpen]
  )

  const onCloseDialog = useCallback(
    (type?: string) => {
      if (type === 'existAccount') {
        setIsExistAccountDialogOpen(false)
        setIsMigrateDialogOpen(true)
      } else {
        setIsNewAccountDialogOpen(false)
        setIsExistAccountDialogOpen(false)
        setMigrateCell(undefined)
      }
    },
    [setIsNewAccountDialogOpen, setIsExistAccountDialogOpen, setMigrateCell]
  )

  const {
    app: { epoch, globalDialog, pageNotice },
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

  const handleGetSpecialAssetColumnInfo = useCallback(
    (item: SpecialAssetCell) => {
      const { timestamp, customizedAssetInfo, capacity, lock, type, data } = item

      return useGetSpecialAssetColumnInfo({
        cell: { capacity, lock, type, data },
        datetime: +timestamp,
        epoch,
        assetInfo: customizedAssetInfo,
        bestKnownBlockTimestamp,
        tokenInfoList,
      })
    },
    [epoch, bestKnownBlockTimestamp, tokenInfoList, useGetSpecialAssetColumnInfo]
  )

  const onViewDetail = useCallback(
    (item: SpecialAssetCell) => {
      const {
        outPoint: { txHash, index },
      } = item
      const explorerUrl = getExplorerUrl(isMainnet)
      openExternal(`${explorerUrl}/transaction/${txHash}#${index}`)
    },
    [isMainnet]
  )

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
        setNFTSendCell({
          nftId: nftFormatter(cell.type?.args, true),
          outPoint: cell.outPoint,
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
          setIsMigrateDialogOpen(true)
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
    [cells, id, dispatch, setAccountToClaim, navigate, setIsMigrateDialogOpen, tokenInfoList]
  )

  return (
    <PageContainer head={t('special-assets.title')} notice={pageNotice} className={styles.container}>
      {totalCount ? (
        <Table
          columns={[
            {
              title: t('special-assets.date'),
              dataIndex: 'timestamp',
              align: 'left',
              render: (_, __, item) => {
                const [date, time] = uniformTimeFormatter(item.timestamp).split(' ')
                return `${date} ${time}`
              },
            },
            {
              title: t('special-assets.assets'),
              dataIndex: 'capacity',
              align: 'left',
              isBalance: true,
              minWidth: '200px',
              render(_, __, item, show) {
                const { amount } = handleGetSpecialAssetColumnInfo(item)
                return show ? amount : HIDE_BALANCE
              },
            },
            {
              title: '',
              dataIndex: '#',
              align: 'right',
              render(_, __, item) {
                const {
                  outPoint: { txHash, index },
                  customizedAssetInfo,
                } = item

                const { status, targetTime, isLockedCheque, isNFTTransferable, isNFTClassOrIssuer, epochsInfo } =
                  handleGetSpecialAssetColumnInfo(item)

                return (
                  <div className={styles.actionBtnBox}>
                    {isNFTClassOrIssuer || (customizedAssetInfo.type === NFTType.NFT && !isNFTTransferable) ? null : (
                      <Button
                        data-tx-hash={txHash}
                        data-idx={index}
                        type="primary"
                        label={t(`special-assets.${status}`)}
                        onClick={handleAction}
                        disabled={
                          ['user-defined-asset', 'locked-asset'].includes(status) ||
                          connectionStatus === ConnectionStatus.Offline ||
                          isLockedCheque
                        }
                        className={`${styles.actionBtn} ${
                          ['user-defined-asset', 'locked-asset', 'user-defined-token'].includes(status) ||
                          isLockedCheque
                            ? styles.hasTooltip
                            : ''
                        }`}
                        data-tooltip={
                          customizedAssetInfo.lock === PresetScript.Cheque && !isLockedCheque
                            ? null
                            : t(`special-assets.${status}-tooltip`, {
                                epochs: epochsInfo?.target.toFixed(2),
                                year: targetTime ? new Date(targetTime).getFullYear() : '',
                                month: targetTime ? new Date(targetTime).getMonth() + 1 : '',
                                day: targetTime ? new Date(targetTime).getDate() : '',
                                hour: targetTime ? new Date(targetTime).getHours() : '',
                                minute: targetTime ? new Date(targetTime).getMinutes() : '',
                              })
                        }
                      />
                    )}
                    <Button
                      type="default"
                      label={t('special-assets.view-details')}
                      className={styles.actionBtn}
                      onClick={() => onViewDetail(item)}
                    />
                  </div>
                )
              },
            },
          ]}
          dataSource={cells}
          noDataContent={t('overview.no-recent-activities')}
        />
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
        <SUDTMigrateDialog
          cell={migrateCell}
          openDialog={onClickMigrate}
          isDialogOpen={isMigrateDialogOpen}
          onCancel={() => setIsMigrateDialogOpen(false)}
        />
      )}

      {migrateCell && (
        <SUDTMigrateToNewAccountDialog
          cell={migrateCell}
          sUDTAccounts={sUDTAccounts}
          walletID={id}
          tokenInfo={migrateTokenInfo}
          isDialogOpen={isNewAccountDialogOpen}
          onCancel={onCloseDialog}
        />
      )}

      {migrateCell && (
        <SUDTMigrateToExistAccountDialog
          cell={migrateCell}
          tokenInfo={migrateTokenInfo}
          sUDTAccounts={sUDTAccounts}
          isMainnet={isMainnet}
          walletID={id}
          isDialogOpen={isExistAccountDialogOpen}
          onCancel={() => onCloseDialog('existAccount')}
          isLightClient={isLightClient}
        />
      )}

      {nFTSendCell ? <NFTSend cell={nFTSendCell} onCancel={() => setNFTSendCell(undefined)} /> : null}
    </PageContainer>
  )
}

SpecialAssetList.displayName = 'SpecialAssetList'

export default SpecialAssetList
