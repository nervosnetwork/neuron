import React, { useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import Balance from 'components/Balance'

import { showTransactionDetails } from 'services/remote'
import { useState as useGlobalState, useDispatch, updateTransactionList } from 'states'

import {
  localNumberFormatter,
  shannonToCKBFormatter,
  uniformTimeFormatter,
  sudtValueToAmount,
  sUDTAmountFormatter,
  backToTop,
  CONSTANTS,
  RoutePath,
  getCurrentUrl,
  getSyncStatus,
  nftFormatter,
} from 'utils'

import { UANTokenName, UANTonkenSymbol } from 'components/UANDisplay'
import styles from './overview.module.scss'

const { PAGE_SIZE, CONFIRMATION_THRESHOLD } = CONSTANTS

const genTypeLabel = (
  type: 'send' | 'receive' | 'create' | 'destroy',
  status: 'pending' | 'confirming' | 'success' | 'failed'
) => {
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
    wallet: { id, balance = '' },
    chain: {
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, bestKnownBlockTimestamp },
      transactions: { items = [] },
      connectionStatus,
      networkID,
    },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const navigate = useNavigate()

  const syncStatus = getSyncStatus({
    bestKnownBlockNumber,
    bestKnownBlockTimestamp,
    cacheTipBlockNumber,
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
    navigate(RoutePath.History)
  }, [navigate])

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
      let typeLabel: string = '--'
      let amount = '--'
      let amountValue = ''
      let { status } = item
      let typeTransProps: {
        i18nKey: string
        components: JSX.Element[]
      } = {
        i18nKey: '',
        components: [],
      }

      if (item.blockNumber !== undefined) {
        const confirmationCount =
          item.blockNumber === null || item.status === 'failed'
            ? 0
            : 1 + Math.max(cacheTipBlockNumber, bestKnownBlockNumber) - +item.blockNumber

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

        if (item.nftInfo) {
          // NFT
          const { type, data } = item.nftInfo
          typeLabel = `${t(`overview.${genTypeLabel(type, status)}`)}`
          amount = `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}`
        } else if (item.sudtInfo?.sUDT) {
          // Asset Account
          if (['create', 'destroy'].includes(item.type)) {
            // create/destroy an account
            typeTransProps = {
              i18nKey: `overview.${item.type}SUDT`,
              components: [
                <UANTokenName
                  name={item.sudtInfo.sUDT.tokenName}
                  symbol={item.sudtInfo.sUDT.symbol}
                  className={styles.tokenName}
                />,
              ],
            }
          } else {
            // send/receive to/from an account
            const type = +item.sudtInfo.amount <= 0 ? 'send' : 'receive'
            typeLabel = `UDT ${t(`overview.${genTypeLabel(type, status)}`)}`
          }
          if (item.sudtInfo.sUDT.decimal) {
            amount = `${sUDTAmountFormatter(sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal))} ${
              item.sudtInfo.sUDT.symbol
            }`
            amountValue = sUDTAmountFormatter(sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal))
          }
        } else {
          // normal tx
          amount = `${shannonToCKBFormatter(item.value)} CKB`
          if (item.type === 'create' || item.type === 'destroy') {
            if (item.assetAccountType === 'CKB') {
              typeLabel = `${t(`overview.${item.type}`, { name: 'CKB' })}`
            } else {
              typeLabel = `${t(`overview.${item.type}`, { name: 'Unknown' })}`
            }
          } else {
            typeLabel = item.nervosDao ? 'Nervos DAO' : t(`overview.${genTypeLabel(item.type, status)}`)
          }
        }
      }

      return {
        ...item,
        status,
        statusLabel: t(`overview.statusLabel.${status}`),
        amount,
        confirmations,
        typeLabel,
        amountValue,
        typeTransProps,
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
                  <th key={field} title={title} aria-label={title} data-field={field}>
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
                amount,
                typeTransProps,
                amountValue,
                sudtInfo,
              } = item
              const time = uniformTimeFormatter(timestamp || createdAt)

              return (
                <tr data-hash={hash} onDoubleClick={onRecentActivityDoubleClick} key={hash}>
                  <td title={time}>{time.split(' ')[0]}</td>
                  {typeTransProps.i18nKey ? (
                    <td>
                      <Trans {...typeTransProps} />
                    </td>
                  ) : (
                    <td>{typeLabel}</td>
                  )}
                  {amountValue ? (
                    <td>
                      {amountValue}&nbsp;
                      <UANTonkenSymbol
                        className={styles.symbol}
                        name={sudtInfo!.sUDT.tokenName}
                        symbol={sudtInfo!.sUDT.symbol}
                      />
                    </td>
                  ) : (
                    <td>{amount}</td>
                  )}
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
  }, [recentItems, cacheTipBlockNumber, bestKnownBlockNumber, t, onRecentActivityDoubleClick])

  return (
    <div className={styles.overview}>
      <h1 className={styles.pageTitle}>{t('navbar.overview')}</h1>
      <div className={styles.balance}>
        <Balance balance={balance} connectionStatus={connectionStatus} syncStatus={syncStatus} />
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
