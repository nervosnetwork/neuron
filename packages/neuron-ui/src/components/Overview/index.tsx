import React, { useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropertyList, { Property } from 'widgets/PropertyList'
import Balance from 'widgets/Balance'

import { showTransactionDetails } from 'services/remote'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { updateTransactionList } from 'states/stateProvider/actionCreators'

import { localNumberFormatter, shannonToCKBFormatter, uniformTimeFormatter } from 'utils/formatters'
import getSyncStatus from 'utils/getSyncStatus'
import getCurrentUrl from 'utils/getCurrentUrl'
import {
  SyncStatus as SyncStatusEnum,
  SyncStatusThatBalanceUpdating,
  ConnectionStatus,
  PAGE_SIZE,
  Routes,
  CONFIRMATION_THRESHOLD,
} from 'utils/const'
import { backToTop } from 'utils/animations'
import styles from './overview.module.scss'

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
    wallet: { id, name, balance = '' },
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
    history.push(Routes.History)
  }, [history])

  const balanceProperties: Property[] = useMemo(() => {
    const balanceValue = shannonToCKBFormatter(balance)
    let prompt = null
    if (ConnectionStatus.Offline === connectionStatus) {
      prompt = (
        <span className={styles.balancePrompt} style={{ color: 'red' }}>
          {t('sync.sync-failed')}
        </span>
      )
    } else if (SyncStatusEnum.SyncNotStart === syncStatus) {
      prompt = (
        <span className={styles.balancePrompt} style={{ color: 'red', wordBreak: 'break-all', whiteSpace: 'pre-line' }}>
          {t('sync.sync-not-start')}
        </span>
      )
    } else if (SyncStatusThatBalanceUpdating.includes(syncStatus) || ConnectionStatus.Connecting === connectionStatus) {
      prompt = <span className={styles.balancePrompt}>{t('sync.syncing-balance')}</span>
    }
    return [
      {
        label: t('overview.balance'),
        value: (
          <div className={styles.balanceValue}>
            <Balance balance={balanceValue} style={{ width: '280px' }} />
            {prompt}
          </div>
        ),
      },
    ]
  }, [t, balance, syncStatus, connectionStatus])

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

  return (
    <div className={styles.overview}>
      <h1 className={styles.walletName}>{name}</h1>
      <PropertyList properties={balanceProperties} />

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
