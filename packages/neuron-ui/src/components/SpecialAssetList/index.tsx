import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { Pagination } from '@uifabric/experiments'
import SpecialAsset, { SpecialAssetProps } from 'components/SpecialAsset'
import Experimental from 'widgets/ExperimentalRibbon'
import { unlockSpecialAsset, getSpecialAssets } from 'services/remote'
import { ckbCore } from 'services/chain'
import {
  CONSTANTS,
  RoutePath,
  PresetScript,
  isMainnet as isMainnetUtil,
  isSuccessResponse,
  queryParsers,
  epochParser,
} from 'utils'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import styles from './specialAssetList.module.scss'

const { PAGE_SIZE, MEDIUM_FEE_RATE } = CONSTANTS

export interface SpecialAssetCell {
  blockHash: string
  blockNumber: string
  capacity: string
  customizedAssetInfo: {
    data: string
    lock: PresetScript.Locktime | string
    type: string
  }
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
  const history = useHistory()
  const [pageNo, setPageNo] = useState<number>(1)
  const { search } = useLocation()
  const dispatch = useDispatch()

  const {
    app: { epoch, globalDialog, tipBlockTimestamp },
    wallet: { id },
    settings: { networks },
    chain: { networkID, connectionStatus },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)

  useEffect(() => {
    dispatch({
      type: AppActions.UpdateGeneratedTx,
      payload: null,
    })
  }, [dispatch])

  const fetchList = useCallback(
    (walletID, pageNum: number) => {
      getSpecialAssets({
        walletID,
        pageNo: pageNum,
        pageSize: PAGE_SIZE,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            const { items, totalCount: count } = res.result as { items: SpecialAssetCell[]; totalCount: string }
            setCells(items.sort((i1, i2) => +i2.timestamp - +i1.timestamp))
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
    const { pageNo: no } = queryParsers.listParams(search)
    setPageNo(no)
    fetchList(id, no)
  }, [search, id, dispatch, fetchList])

  useEffect(() => {
    if (globalDialog === 'unlock-success') {
      fetchList(id, pageNo)
    }
  }, [globalDialog, fetchList, id, pageNo])

  const onUnlock = useCallback(
    e => {
      const {
        dataset: { txHash, idx },
      } = e.target
      const cell = cells.find(c => c.outPoint.txHash === txHash && c.outPoint.index === idx)
      if (!cell) {
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            timestamp: +new Date(),
            content: 'Cannot find the cell',
          },
        })
      } else {
        unlockSpecialAsset({
          walletID: id,
          outPoint: cell.outPoint,
          feeRate: `${MEDIUM_FEE_RATE}`,
          customizedAssetInfo: cell.customizedAssetInfo,
        }).then(res => {
          if (isSuccessResponse(res)) {
            dispatch({
              type: AppActions.UpdateGeneratedTx,
              payload: res.result,
            })
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: id,
                actionType: 'unlock',
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
        })
      }
    },
    [cells, id, dispatch]
  )

  const list = useMemo(() => {
    return cells.map(cell => {
      let status: SpecialAssetProps['status'] = 'user-defined-asset'
      let epochInfo: { target: number; current: number } | undefined
      if (cell.customizedAssetInfo.lock === PresetScript.Locktime) {
        const targetEpochInfo = epochParser(ckbCore.utils.toHexInLittleEndian(`0x${cell.lock.args.slice(-16)}`))
        const currentEpochInfo = epochParser(epoch)
        const targetEpochFraction =
          Number(targetEpochInfo.length) > 0 ? Number(targetEpochInfo.index) / Number(targetEpochInfo.length) : 1
        epochInfo = {
          target: Number(targetEpochInfo.number) + Math.min(targetEpochFraction, 1),
          current: Number(currentEpochInfo.number) + Number(currentEpochInfo.index) / Number(currentEpochInfo.length),
        }
        if (epochInfo.target - epochInfo.current > 0) {
          status = 'locked-asset'
        } else {
          status = 'claim-asset'
        }
      }

      return (
        <SpecialAsset
          key={`${cell.outPoint.txHash}-${cell.outPoint.index}`}
          datetime={+cell.timestamp}
          capacity={cell.capacity}
          hasTypeScript={!!cell.type}
          hasData={cell.data !== '0x'}
          outPoint={cell.outPoint}
          isMainnet={isMainnet}
          status={status}
          epochsInfo={epochInfo}
          onAction={onUnlock}
          connectionStatus={connectionStatus}
          tipBlockTimestamp={tipBlockTimestamp}
        />
      )
    })
  }, [cells, epoch, isMainnet, onUnlock, connectionStatus, tipBlockTimestamp])

  return (
    <div className={styles.container}>
      <Experimental tag="customized-assset" />
      <div className={styles.title}>{t('special-assets.title')}</div>
      {totalCount ? (
        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <span>{t('special-assets.date')}</span>
            <span>{t('special-assets.capacity')}</span>
          </div>
          {list}
        </div>
      ) : null}
      {totalCount || !loaded ? null : <div className={styles.noItems}>{t('special-assets.no-special-assets')}</div>}

      <div className={styles.pagination}>
        {totalCount ? (
          <Pagination
            selectedPageIndex={pageNo - 1}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            itemsPerPage={PAGE_SIZE}
            totalItemCount={totalCount}
            previousPageAriaLabel={t('pagination.previous-page')}
            nextPageAriaLabel={t('pagination.next-page')}
            firstPageAriaLabel={t('pagination.first-page')}
            lastPageAriaLabel={t('pagination.last-page')}
            pageAriaLabel={t('pagination.page')}
            selectedAriaLabel={t('pagination.selected')}
            firstPageIconProps={{ iconName: 'FirstPage' }}
            previousPageIconProps={{ iconName: 'PrevPage' }}
            nextPageIconProps={{ iconName: 'NextPage' }}
            lastPageIconProps={{ iconName: 'LastPage' }}
            format="buttons"
            onPageChange={(idx: number) => {
              history.push(`${RoutePath.SpecialAssets}?pageNo=${idx + 1}`)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

SpecialAssetList.displayName = 'SpecialAssetList'

export default SpecialAssetList
