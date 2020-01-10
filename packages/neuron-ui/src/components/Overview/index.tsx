import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropertyList, { Property } from 'widgets/PropertyList'

import { showTransactionDetails } from 'services/remote'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { updateTransactionList } from 'states/stateProvider/actionCreators'

import {
  localNumberFormatter,
  shannonToCKBFormatter,
  difficultyFormatter,
  uniformTimeFormatter,
} from 'utils/formatters'
import { epochParser } from 'utils/parsers'
import { PAGE_SIZE, Routes, CONFIRMATION_THRESHOLD, MAX_TIP_BLOCK_DELAY, BUFFER_BLOCK_NUMBER } from 'utils/const'
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
    app: { tipBlockNumber, tipBlockTimestamp, chain, epoch, difficulty },
    wallet: { id, name, balance = '' },
    chain: {
      tipBlockNumber: syncedBlockNumber,
      transactions: { items = [] },
    },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()
  const [isStatusShow, setIsStatusShow] = useState(false)

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

  const now = Date.now()

  const balanceProperties: Property[] = useMemo(() => {
    const balanceValue = shannonToCKBFormatter(balance)
    const [balanceInt, balanceDec] = balanceValue.split('.')
    const balanceIntEl = <span className={styles.balanceInt}>{balanceInt}</span>
    const balanceDecEl = balanceDec ? <span>{`.${balanceDec}`}</span> : null
    const balanceSuffixEl = (
      <span>
        {` CKB${
          +tipBlockNumber > 0 &&
          BigInt(syncedBlockNumber) >= BigInt(0) &&
          (BigInt(syncedBlockNumber) + BigInt(BUFFER_BLOCK_NUMBER) < BigInt(tipBlockNumber) ||
            tipBlockTimestamp + MAX_TIP_BLOCK_DELAY < now)
            ? `(${t('overview.syncing')})`
            : ''
        }`}
      </span>
    )
    return [
      {
        label: t('overview.balance'),
        value: (
          <>
            {balanceIntEl}
            {balanceDecEl}
            {balanceSuffixEl}
          </>
        ),
      },
    ]
  }, [t, balance, syncedBlockNumber, tipBlockNumber, tipBlockTimestamp, now])
  const blockchainStatusProperties = useMemo(
    () => [
      {
        label: t('overview.chain-identity'),
        value: chain,
      },
      {
        label: t('overview.tip-block-number'),
        value: localNumberFormatter(tipBlockNumber),
      },
      {
        label: t('overview.epoch'),
        value: epochParser(epoch).number.toString(),
      },
      {
        label: t('overview.difficulty'),
        value: difficultyFormatter(difficulty),
      },
    ],
    [t, chain, epoch, difficulty, tipBlockNumber]
  )

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

  const onStatusClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if ((e.target as HTMLDivElement).getAttribute('role') === 'button') {
        setIsStatusShow(show => !show)
      }
    },
    [setIsStatusShow]
  )

  const onStatusBlur = useCallback(() => {
    setIsStatusShow(false)
  }, [setIsStatusShow])

  return (
    <div className={styles.overview}>
      <h1 className={styles.walletName}>{name}</h1>
      <PropertyList properties={balanceProperties} />
      <button
        className={styles.blockchainStatus}
        type="button"
        title={t('overview.blockchain-status')}
        onClick={onStatusClick}
        onBlur={onStatusBlur}
      >
        <div role="button">{t('overview.blockchain-status')}</div>
        {isStatusShow ? (
          <section>
            {blockchainStatusProperties.map(({ label, value }) => (
              <div key={label} title={label}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </section>
        ) : null}
      </button>
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
        <div>{t('overview.no-recent-activities')}</div>
      )}
    </div>
  )
}

Overview.displayName = 'Overview'

export default Overview
