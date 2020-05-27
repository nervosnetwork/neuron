import React, { useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'
import CopyZone from 'widgets/CopyZone'

import { showTransactionDetails } from 'services/remote'
import { useState as useGlobalState, useDispatch, updateTransactionList } from 'states'

import {
  localNumberFormatter,
  shannonToCKBFormatter,
  uniformTimeFormatter,
  backToTop,
  CONSTANTS,
  RoutePath,
  getCurrentUrl,
  getSyncStatus,
} from 'utils'

import styles from './overview.module.scss'

const { PAGE_SIZE, CONFIRMATION_THRESHOLD } = CONSTANTS

const genTypeLabel = (type: 'send' | 'receive', status: 'pending' | 'confirming' | 'success' | 'failed') => {
  switch (type) {
    case 'send': {
      if (status === 'failed') {
        return 'sent'
      }
      if (status === 'pending' || status === 'confirming') {
        return 'sending'
      }
      return 'sent'
    }
    case 'receive': {
      if (status === 'failed') {
        return 'received'
      }
      if (status === 'pending' || status === 'confirming') {
        return 'receiving'
      }
      return 'received'
    }
    default: {
      return type
    }
  }
}

const Overview = () => {
  const {
    app: { tipBlockNumber, tipBlockTimestamp },
    wallet: { id, balance = '' },
    chain: {
      tipBlockNumber: syncedBlockNumber,
      transactions: { items = [] },
      connectionStatus,
      networkID,
    },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()

  const syncStatus = getSyncStatus({
    syncedBlockNumber,
    tipBlockNumber,
    tipBlockTimestamp,
    currentTimestamp: Date.now(),
    url: getCurrentUrl(networkID, networks),
  })

  useEffect(() => {
    if (id) {
      backToTop()
    }
  }, [id])

  useEffect(() => {
    updateTransactionList({
      pageNo: 1,
      pageSize: PAGE_SIZE,
      keywords: '',
      walletID: id,
    })(dispatch)
  }, [id, dispatch])
  const onGoToHistory = useCallback(() => {
    history.push(RoutePath.History)
  }, [history])

  const onRecentActivityDoubleClick = useCallback((e: React.SyntheticEvent) => {
    const cellElement = e.target as HTMLTableCellElement
    if (cellElement?.parentElement?.dataset?.hash) {
      showTransactionDetails(cellElement.parentElement.dataset.hash)
    }
  }, [])

  const recentItems = useMemo(() => {
    return items.slice(0, 10)
  }, [items])

  const RecentActivites = useMemo(() => {
    const activities = recentItems.map(item => {
      let confirmations = ''
      let typeLabel: string = item.type
      let { status } = item
      if (item.blockNumber !== undefined) {
        const confirmationCount =
          item.blockNumber === null || item.status === 'failed'
            ? 0
            : 1 + Math.max(+syncedBlockNumber, +tipBlockNumber) - +item.blockNumber

        if (status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD) {
          status = 'confirming' as any

          if (confirmationCount === 1) {
            confirmations = t('overview.confirmation', {
              confirmationCount: localNumberFormatter(confirmationCount),
            })
          } else if (confirmationCount > 1) {
            confirmations = `${t('overview.confirmations', {
              confirmationCount: localNumberFormatter(confirmationCount),
            })}`
          }
        }

        typeLabel = genTypeLabel(item.type, status)
      }

      return {
        ...item,
        status,
        statusLabel: t(`overview.statusLabel.${status}`),
        value: item.value.replace(/^-/, ''),
        confirmations,
        typeLabel: t(`overview.${typeLabel}`),
      }
    })
    return (
      <div className={styles.recentActivities}>
        <table>
          <thead>
            <tr>
              {['date', 'type', 'amount', 'status'].map(field => {
                const title = t(`overview.${field}`)
                return (
                  <th key={field} title={title} aria-label={title}>
                    {title}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {activities.map(item => {
              const {
                confirmations,
                createdAt,
                status,
                hash,
                statusLabel,
                timestamp,
                typeLabel,
                value,
                nervosDao,
              } = item
              const time = uniformTimeFormatter(timestamp || createdAt)

              return (
                <tr data-hash={hash} onDoubleClick={onRecentActivityDoubleClick} key={hash}>
                  <td title={time}>{time.split(' ')[0]}</td>
                  <td>{nervosDao ? 'Nervos DAO' : typeLabel}</td>
                  <td>{`${shannonToCKBFormatter(value)} CKB`}</td>
                  <td className={styles.txStatus} data-status={status}>
                    <div>
                      <span>{statusLabel}</span>
                      {confirmations ? <span>{confirmations}</span> : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }, [recentItems, syncedBlockNumber, tipBlockNumber, t, onRecentActivityDoubleClick])

  const ckbBalance = shannonToCKBFormatter(balance)

  return (
    <div className={styles.overview}>
      {/* <h1 className={styles.walletName}>{name}</h1> */}
      <h1 className={styles.pageTitle}>{t('navbar.overview')}</h1>
      <div className={styles.balance}>
        <span>{`${t('overview.balance')}:`}</span>
        <CopyZone content={ckbBalance.replace(/,/g, '')} name={t('overview.copy-balance')}>
          <span className={styles.balanceValue}>{`${ckbBalance}`}</span>
        </CopyZone>
        <BalanceSyncIcon connectionStatus={connectionStatus} syncStatus={syncStatus} />
      </div>

      <h2 className={styles.recentActivitiesTitle}>{t('overview.recent-activities')}</h2>
      {items.length ? (
        <>
          {RecentActivites}
          {items.length > 10 ? (
            <div className={styles.linkToHistory}>
              <span role="link" onClick={onGoToHistory} onKeyPress={() => {}} tabIndex={0}>
                {t('overview.more')}
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.noActivities}>{t('overview.no-recent-activities')}</div>
      )}
    </div>
  )
}

Overview.displayName = 'Overview'

export default Overview
