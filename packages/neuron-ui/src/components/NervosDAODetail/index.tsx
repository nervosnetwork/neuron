import React, { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, transactionState, useDispatch, showPageNotice } from 'states'
import {
  backToTop,
  shannonToCKBFormatter,
  clsx,
  isSuccessResponse,
  ErrorCode,
  localNumberFormatter,
  uniformTimeFormatter,
  useGoBack,
} from 'utils'
import { currentWallet as currentWalletCache } from 'services/localCache'
import { getTransaction } from 'services/remote'
import PageContainer, { Breadcrumbs } from 'components/PageContainer'
import { useParams } from 'react-router-dom'

import Tabs, { VariantProps } from 'widgets/Tabs'
import { onEnter } from 'utils/inputDevice'
import { Copy, GoBack, BalanceHide, BalanceShow } from 'widgets/Icons/icon'
import CopyZone from 'widgets/CopyZone'
import { HIDE_BALANCE } from 'utils/const'
import styles from './nervosDAODetail.module.scss'
import hooks from './hooks'
import CellsCard from './CellsCard'

const TabsVariantWithTxTypes: FC<
  VariantProps<{
    title: string
    hash: string
  }>
> = ({ tabs, selectedTab, onTabChange }) => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const currentWallet = currentWalletCache.load()
    if (currentWallet) {
      getTransaction({ hash: selectedTab.hash, walletID: currentWallet.id })
        .then(res => {
          if (isSuccessResponse(res)) {
            setTransaction(res.result)
          } else {
            setError(t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' }))
          }
        })
        .catch((err: Error) => {
          setError(err.message)
        })
    }
  }, [t, selectedTab.hash])
  const dispatch = useDispatch()
  const onCopy = useCallback(() => {
    window.navigator.clipboard.writeText(transaction.hash)
    showPageNotice('common.copied')(dispatch)
  }, [transaction.hash, dispatch])
  const [isIncomeShow, setIsIncomeShow] = useState(true)
  const onChangeIncomeShow = useCallback(() => {
    setIsIncomeShow(v => !v)
  }, [])

  return (
    <>
      {error && <div>{error}</div>}
      <div className={styles.txTypes} role="tablist">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={clsx(styles.txType, { [styles.active]: selectedTab.id === tab.id })}
            role="tab"
            tabIndex={0}
            onKeyDown={onEnter(() => onTabChange(tab.id))}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className={styles.txPanel} role="tabpanel">
        <div className={styles.overview}>
          <div className={clsx(styles.row, styles.title)}>{t('nervos-dao-detail.basic-information')}</div>
          <div className={styles.fieldName}>{t('nervos-dao-detail.transaction-hash')}</div>
          <div className={clsx(styles.fieldValue, styles.fullRow, styles.bold, styles.txHash)}>
            {transaction.hash}
            <Copy onClick={onCopy} />
          </div>
          <div className={styles.fieldName}>{t('nervos-dao-detail.blockNumber')}</div>
          <div className={styles.fieldValue}>
            {transaction.blockNumber ? localNumberFormatter(transaction.blockNumber) : 'none'}
          </div>
          <div className={styles.fieldName}>{t('nervos-dao-detail.datetime')}</div>
          <div className={styles.fieldValue}>
            {+(transaction.timestamp || transaction.createdAt)
              ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
              : 'none'}
          </div>
          <div className={styles.fieldName}>{t('nervos-dao-detail.income')}</div>
          {isIncomeShow ? (
            <div className={clsx(styles.fieldValue, styles.fullRow, styles.income)}>
              <CopyZone
                content={shannonToCKBFormatter(transaction.value, false, '')}
                className={styles.incomeCopy}
                maskRadius={8}
              >
                {`${shannonToCKBFormatter(transaction.value)} CKB`}
              </CopyZone>
              <BalanceShow onClick={onChangeIncomeShow} />
            </div>
          ) : (
            <div className={clsx(styles.fieldValue, styles.fullRow, styles.income)}>
              {`${HIDE_BALANCE} CKB`}
              <BalanceHide onClick={onChangeIncomeShow} />
            </div>
          )}
        </div>

        <CellsCard transaction={transaction} />
      </div>
    </>
  )
}

const getRecordKey = ({ depositOutPoint, outPoint }: State.NervosDAORecord) => {
  return depositOutPoint ? `${depositOutPoint.txHash}-${depositOutPoint.index}` : `${outPoint.txHash}-${outPoint.index}`
}

const NervosDAODetail = () => {
  const {
    app: { pageNotice },
    wallet,
    nervosDAO: { records },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()

  hooks.useInitData({ dispatch, wallet })

  useEffect(() => {
    backToTop()
  }, [])

  const { depositOutPoint } = useParams<{ depositOutPoint: string }>()
  const daoRecord = records.find(record => getRecordKey(record) === depositOutPoint)
  const hash = daoRecord?.depositOutPoint?.txHash ?? daoRecord?.outPoint.txHash
  const onBack = useGoBack()

  return (
    <PageContainer
      head={
        <Breadcrumbs>
          <>
            <GoBack className={styles.goBack} onClick={onBack} />
            <span>{t('nervos-dao-detail.tx-detail')}</span>
          </>
        </Breadcrumbs>
      }
      notice={pageNotice}
    >
      {hash && (
        <Tabs
          Variant={TabsVariantWithTxTypes}
          tabs={[
            {
              id: 'deposit',
              title: t('nervos-dao-detail.deposited'),
              hash,
            },
            daoRecord?.withdrawInfo?.txHash && {
              id: 'withdraw',
              title: t('nervos-dao-detail.withdrawn'),
              hash: daoRecord.withdrawInfo.txHash,
            },
            daoRecord?.unlockInfo?.txHash && {
              id: 'unlock',
              title: t('nervos-dao-detail.unlocked'),
              hash: daoRecord.unlockInfo.txHash,
            },
          ].filter((v): v is { id: string; title: string; hash: string } => Boolean(v))}
        />
      )}
    </PageContainer>
  )
}

NervosDAODetail.displayName = 'NervosDAODetail'

export default NervosDAODetail
