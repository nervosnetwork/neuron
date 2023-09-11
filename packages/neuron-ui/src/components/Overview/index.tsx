import React, { useCallback, useMemo, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch, updateTransactionList } from 'states'

import { shannonToCKBFormatter, uniformTimeFormatter, backToTop, CONSTANTS, RoutePath, useFirstLoadWallet } from 'utils'

import { UANTokenName } from 'components/UANDisplay'
import PageContainer from 'components/PageContainer'
import TransactionStatusWrap from 'components/TransactionStatusWrap'
import FormattedTokenAmount from 'components/FormattedTokenAmount'
import Receive from 'components/Receive'
import AddressBook from 'components/AddressBook'
import Table from 'widgets/Table'
import Button from 'widgets/Button'
import { ArrowNext, EyesClose, EyesOpen, OverviewSend, OverviewReceive, Addressbook } from 'widgets/Icons/icon'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'
import CopyZone from 'widgets/CopyZone'
import { HIDE_BALANCE } from 'utils/const'
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

const TransactionStatus = ({
  item,
  cacheTipBlockNumber,
  bestKnownBlockNumber,
}: {
  item: Omit<State.Transaction, 'status'> & { status: State.Transaction['status'] | 'confirming' }
  cacheTipBlockNumber: number
  bestKnownBlockNumber: number
}) => {
  let confirmationCount
  let { status } = item

  if (item.blockNumber !== undefined) {
    confirmationCount =
      item.blockNumber === null || item.status === 'failed'
        ? 0
        : 1 + Math.max(cacheTipBlockNumber, bestKnownBlockNumber) - +item.blockNumber

    status = item.status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD ? 'confirming' : item.status
  }

  return (
    <div className={styles.txStatus} data-status={status}>
      <TransactionStatusWrap status={status} confirmationCount={confirmationCount} />
    </div>
  )
}

const TracsactionType = ({
  item,
  cacheTipBlockNumber,
  bestKnownBlockNumber,
}: {
  item: Omit<State.Transaction, 'status'> & { status: State.Transaction['status'] | 'confirming' }
  cacheTipBlockNumber: number
  bestKnownBlockNumber: number
}) => {
  const [t] = useTranslation()
  let typeLabel: string = '--'
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
      status = 'confirming'
    }
    if (item.nftInfo) {
      // NFT
      const { type } = item.nftInfo
      typeLabel = `${t(`overview.${genTypeLabel(type, status)}`)}`
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
    } else if (item.type === 'create' || item.type === 'destroy') {
      // normal tx
      if (item.assetAccountType === 'CKB') {
        typeLabel = `${t(`overview.${item.type}`, { name: 'CKB' })}`
      } else {
        typeLabel = `${t(`overview.${item.type}`, { name: 'Unknown' })}`
      }
    } else {
      typeLabel = item.nervosDao ? 'Nervos DAO' : t(`overview.${genTypeLabel(item.type, status)}`)
    }
  }
  return typeTransProps.i18nKey ? <Trans {...typeTransProps} /> : <>{typeLabel}</>
}

const Overview = () => {
  const {
    app: { pageNotice },
    wallet: { id, balance = '', addresses },
    chain: {
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, syncStatus },
      transactions: { items = [] },
      connectionStatus,
    },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const navigate = useNavigate()

  const [showReceive, setShowReceive] = useState(false)
  const [showAddressBook, setShowAddressBook] = useState(false)

  const isSingleAddress = addresses.length === 1

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

  const onRecentActivityClick = useCallback((_, item: State.Transaction) => {
    const { hash } = item
    navigate(`${RoutePath.Overview}/${hash}`)
  }, [])

  const recentItems = useMemo(() => {
    return items.slice(0, 10)
  }, [items])

  useFirstLoadWallet(dispatch, id)

  const [showBalance, setShowBalance] = useState(true)
  const onChangeShowBalance = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])

  return (
    <PageContainer head={t('navbar.overview')} notice={pageNotice} isHomePage>
      <div className={styles.topContainer}>
        <div className={styles.mid}>
          <div className={styles.balance}>
            <span className={styles.balanceTitle}>
              {t('overview.balance')}
              {showBalance ? (
                <EyesOpen onClick={onChangeShowBalance} className={styles.balanceIcon} />
              ) : (
                <EyesClose onClick={onChangeShowBalance} className={styles.balanceIcon} />
              )}
            </span>
            {showBalance ? (
              <CopyZone content={shannonToCKBFormatter(balance, false, '')} className={styles.copyBalance}>
                <span className={styles.balanceValue}>{shannonToCKBFormatter(balance)}</span>
              </CopyZone>
            ) : (
              <span className={styles.balanceValue}>{HIDE_BALANCE}</span>
            )}
            <span className={styles.balanceUnit}>CKB</span>
            <BalanceSyncIcon connectionStatus={connectionStatus} syncStatus={syncStatus} />
            <div className={styles.items}>
              {isSingleAddress ? null : (
                <Button className={styles.addressBook} onClick={() => setShowAddressBook(true)}>
                  <Addressbook />
                </Button>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <Link className={styles.send} to={RoutePath.Send}>
              <Button type="primary">
                <OverviewSend />
                <div>{t('overview.send')}</div>
              </Button>
            </Link>
            <Button type="primary" className={styles.receive} onClick={() => setShowReceive(true)}>
              <OverviewReceive />
              {t('overview.receive')}
            </Button>
          </div>
        </div>
      </div>

      <Table
        head={
          <div className={styles.transactionTableHead}>
            <h2 className={styles.recentActivitiesTitle}>{t('overview.recent-activities')}</h2>
            {items.length > 10 && (
              <Link className={styles.linkToHistory} to={RoutePath.History}>
                {t('overview.more')}
                <ArrowNext />
              </Link>
            )}
          </div>
        }
        columns={[
          {
            title: t('overview.date'),
            dataIndex: 'date',
            align: 'left',
            minWidth: '150px',
            render: (_, __, item) => {
              const time = uniformTimeFormatter(item.timestamp || item.createdAt)
              return time.split(' ')[0]
            },
          },
          {
            title: t('overview.type'),
            dataIndex: 'type',
            align: 'left',
            minWidth: '250px',
            render(_, __, item) {
              return (
                <TracsactionType
                  item={item}
                  cacheTipBlockNumber={cacheTipBlockNumber}
                  bestKnownBlockNumber={bestKnownBlockNumber}
                />
              )
            },
          },
          {
            title: t('overview.amount'),
            dataIndex: 'amount',
            align: 'left',
            isBalance: true,
            minWidth: '300px',
            render(_, __, item, show) {
              return <FormattedTokenAmount item={item} show={show} />
            },
          },
          {
            title: t('overview.status'),
            dataIndex: 'status',
            align: 'left',
            minWidth: '150px',
            render(_, __, item) {
              return (
                <TransactionStatus
                  item={item}
                  cacheTipBlockNumber={cacheTipBlockNumber}
                  bestKnownBlockNumber={bestKnownBlockNumber}
                />
              )
            },
          },
        ]}
        dataSource={recentItems}
        noDataContent={t('overview.no-recent-activities')}
        onRowClick={onRecentActivityClick}
      />

      {showReceive ? <Receive onClose={() => setShowReceive(false)} /> : null}
      {showAddressBook ? <AddressBook onClose={() => setShowAddressBook(false)} /> : null}
    </PageContainer>
  )
}

Overview.displayName = 'Overview'

export default Overview
