import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import Pagination from 'widgets/Pagination'
import Table from 'widgets/Table'
import Button from 'widgets/Button'
import Toast from 'widgets/Toast'
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
  sporeFormatter,
} from 'utils'
import { NetworkType, HIDE_BALANCE } from 'utils/const'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import SUDTUpdateDialog, { SUDTUpdateDialogProps } from 'components/SUDTUpdateDialog'
import { TokenInfo } from 'components/SUDTCreateDialog'
import SUDTMigrateDialog from 'components/SUDTMigrateDialog'
import SUDTMigrateToNewAccountDialog from 'components/SUDTMigrateToNewAccountDialog'
import SUDTMigrateToExistAccountDialog from 'components/SUDTMigrateToExistAccountDialog'
import PageContainer from 'components/PageContainer'
import NFTSend from 'components/NFTSend'
import Tooltip from 'widgets/Tooltip'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { useGetAssetAccounts, useSpecialAssetColumnInfo, SpecialAssetCell } from './hooks'

import styles from './specialAssetList.module.scss'
import CopyZone from '../../widgets/CopyZone'

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

  Spore = 'Spore',
  Cluster = 'SporeCluster',
}

export interface NFTAssetInfo {
  data: string
  lock: string
  type: NFTType
}

type UnknownAssetInfo = Record<'data' | 'lock' | 'type', string>

export type AssetInfo = LocktimeAssetInfo | ChequeAssetInfo | UnknownAssetInfo | NFTAssetInfo

const { PAGE_SIZE } = CONSTANTS

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
        nftType?: NFTType
        nftId: string
        outPoint: {
          index: string
          txHash: string
        }
      }
    | undefined
  >()
  const [migrateTokenInfo, setMigrateTokenInfo] = useState<Controller.GetTokenInfoList.TokenInfo | undefined>()
  const [notice, setNotice] = useState('')

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

  const onCloseDialog = useCallback(() => {
    setIsExistAccountDialogOpen(false)
    setIsNewAccountDialogOpen(false)
    setIsMigrateDialogOpen(false)
  }, [setIsNewAccountDialogOpen, setIsExistAccountDialogOpen, setIsMigrateDialogOpen])

  const onBack = useCallback(() => {
    setIsExistAccountDialogOpen(false)
    setIsNewAccountDialogOpen(false)
    setIsMigrateDialogOpen(true)
  }, [setIsNewAccountDialogOpen, setIsExistAccountDialogOpen, setIsMigrateDialogOpen])

  const {
    app: { epoch },
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
    () => networks.find(n => n.id === networkID)?.type === NetworkType.Light,
    [networkID, networks]
  )
  const foundTokenInfo = tokenInfoList.find(token => token.tokenID === accountToClaim?.account.tokenID)
  const accountNames = useMemo(() => sUDTAccounts.filter(v => !!v.accountName).map(v => v.accountName!), [sUDTAccounts])

  useGetAssetAccounts(id)

  const handleGetSpecialAssetColumnInfo = useSpecialAssetColumnInfo({
    epoch,
    bestKnownBlockTimestamp,
    tokenInfoList,
    t,
  })

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

  const handleActionSuccess = useCallback(
    (text: string) => {
      setNotice(text)
      fetchList(id, pageNo)
    },
    [setNotice, fetchList, id, pageNo]
  )

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
        udtType: accountToClaim.account.udtType,
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
            payload: {
              walletID: id,
              actionType: 'create-account-to-claim-cheque',
              onSuccess: () => {
                handleActionSuccess(t('special-assets.claim-cheque-success'))
              },
            },
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
      if (cell.customizedAssetInfo.type === 'Spore') {
        setNFTSendCell({
          // unnecessary id for the spore
          nftId: cell.type?.args ?? '',
          outPoint: cell.outPoint,
          nftType: NFTType.Spore,
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
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: id,
                actionType,
                onSuccess: () => {
                  handleActionSuccess(t(`special-assets.${actionType}-success`))
                },
              },
            })
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
        default: {
          // ignore
        }
      }
      switch (cell.customizedAssetInfo.type) {
        case PresetScript.XUDT:
        case PresetScript.SUDT: {
          setMigrateCell(cell)
          const findTokenInfo = tokenInfoList.find(info => info.tokenID === cell.type?.args)

          setMigrateTokenInfo(findTokenInfo)
          setIsMigrateDialogOpen(true)
          break
        }
        default:
          break
      }
    },
    [cells, id, dispatch, setAccountToClaim, navigate, setIsMigrateDialogOpen, tokenInfoList, handleActionSuccess]
  )

  return (
    <PageContainer head={t('special-assets.title')} className={styles.container}>
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
                const { amount, isSpore, sporeClusterInfo } = handleGetSpecialAssetColumnInfo(item)

                if (isSpore && item.type && show) {
                  const formattedSporeInfo = sporeFormatter({
                    args: item.type.args,
                    data: item.data,
                    truncate: Infinity,
                    clusterName: sporeClusterInfo?.name,
                  })
                  return (
                    <CopyZone content={formattedSporeInfo} title={sporeClusterInfo?.description}>
                      {amount}
                    </CopyZone>
                  )
                }

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

                const {
                  status,
                  targetTime,
                  isLockedCheque,
                  isNFTTransferable,
                  isNFTClassOrIssuer,
                  epochsInfo,
                  udtType,
                } = handleGetSpecialAssetColumnInfo(item)

                if (isNFTClassOrIssuer || (customizedAssetInfo.type === NFTType.NFT && !isNFTTransferable)) {
                  return (
                    <div className={styles.actionBtnBox}>
                      <Button
                        label={t('special-assets.view-details')}
                        className={`${styles.actionBtn} ${styles.detailBtn}`}
                        onClick={() => onViewDetail(item)}
                      />
                    </div>
                  )
                }

                let tip = ''

                const showTip =
                  ['user-defined-asset', 'locked-asset', 'user-defined-token'].includes(status) || isLockedCheque

                if (showTip) {
                  tip = t(`special-assets.${status}-tooltip`, {
                    udtType,
                    epochs: epochsInfo?.target.toFixed(2),
                    year: targetTime ? new Date(targetTime).getFullYear() : '',
                    month: targetTime ? new Date(targetTime).getMonth() + 1 : '',
                    day: targetTime ? new Date(targetTime).getDate() : '',
                    hour: targetTime ? new Date(targetTime).getHours() : '',
                    minute: targetTime ? new Date(targetTime).getMinutes() : '',
                  })
                }

                const btnDisabled =
                  ['user-defined-asset', 'locked-asset'].includes(status) ||
                  connectionStatus === ConnectionStatus.Offline ||
                  isLockedCheque

                return (
                  <div className={styles.actionBtnBox}>
                    {showTip ? (
                      <Tooltip tipClassName={styles.tip} tip={<p className={styles.tooltip}>{tip}</p>} showTriangle>
                        <Button
                          data-tx-hash={txHash}
                          data-idx={index}
                          data-status={status}
                          type="primary"
                          label={t(`special-assets.${status}`, { udtType })}
                          className={styles.actionBtn}
                          onClick={handleAction}
                          disabled={!!btnDisabled}
                        />
                      </Tooltip>
                    ) : (
                      <Button
                        data-tx-hash={txHash}
                        data-idx={index}
                        data-status={status}
                        type="primary"
                        label={t(`special-assets.${status}`)}
                        className={styles.actionBtn}
                        onClick={handleAction}
                        disabled={!!btnDisabled}
                      />
                    )}
                    <Button
                      label={t('special-assets.view-details')}
                      className={`${styles.actionBtn} ${styles.detailBtn}`}
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
      {totalCount || !loaded ? null : (
        <div className={styles.noRecords}>
          <img src={TableNoData} alt="No Data" />
          {t('special-assets.no-special-assets')}
        </div>
      )}
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

      {migrateCell && isMigrateDialogOpen ? (
        <SUDTMigrateDialog
          cell={migrateCell}
          openDialog={onClickMigrate}
          onCancel={() => setIsMigrateDialogOpen(false)}
        />
      ) : null}

      {migrateCell && isNewAccountDialogOpen ? (
        <SUDTMigrateToNewAccountDialog
          cell={migrateCell}
          sUDTAccounts={sUDTAccounts}
          walletID={id}
          tokenInfo={migrateTokenInfo}
          onCloseDialog={onCloseDialog}
          onBack={onBack}
          onSuccess={handleActionSuccess}
        />
      ) : null}

      {migrateCell && isExistAccountDialogOpen ? (
        <SUDTMigrateToExistAccountDialog
          cell={migrateCell}
          tokenInfo={migrateTokenInfo}
          sUDTAccounts={sUDTAccounts}
          isMainnet={isMainnet}
          walletID={id}
          onCloseDialog={onCloseDialog}
          onBack={onBack}
          isLightClient={isLightClient}
          onSuccess={handleActionSuccess}
        />
      ) : null}

      {nFTSendCell ? (
        <NFTSend
          nftType={nFTSendCell.nftType}
          cell={nFTSendCell}
          onCancel={() => setNFTSendCell(undefined)}
          onSuccess={handleActionSuccess}
        />
      ) : null}

      <Toast content={notice} onDismiss={() => setNotice('')} />
    </PageContainer>
  )
}

SpecialAssetList.displayName = 'SpecialAssetList'

export default SpecialAssetList
