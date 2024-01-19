import React, { FC, useCallback, useState } from 'react'
import { showPageNotice, useDispatch, useState as useGlobalState } from 'states'
import { Copy, EyesOpen, GoBack } from 'widgets/Icons/icon'
import PageContainer from 'components/PageContainer'
import { useTranslation } from 'react-i18next'
import { RoutePath, clsx, shannonToCKBFormatter, useGoBack, isMainnet as isMainnetUtils } from 'utils'
import Tabs from 'widgets/Tabs'
import { HIDE_BALANCE } from 'utils/const'
import PasswordRequestInPage from 'components/PasswordRequest/PasswordRequestInPage'
import { useNavigate } from 'react-router-dom'
import useShowBalance from './hooks'
import styles from './sendTxDetail.module.scss'
import TxTopology from './TxTopology'

enum TabId {
  Basic,
  Topology,
}

const TxBasic: FC<{
  tx: State.GeneratedTx
}> = ({ tx }) => {
  const [t] = useTranslation()
  const capacities = tx.inputs.reduce((total, addr) => total + BigInt(addr.capacity || 0), BigInt(0)).toString()
  const dispatch = useDispatch()
  const onCopy = useCallback(() => {
    window.navigator.clipboard.writeText(tx.hash)
    showPageNotice('common.copied')(dispatch)
  }, [tx.hash, dispatch])
  const { isBalanceShow: showCapacity, onChange: onChangeCapacityVisible } = useShowBalance()
  const { isBalanceShow: showFee, onChange: onChangeFeeVisible } = useShowBalance()
  return (
    <div className={styles.txBasicRoot}>
      <div className={styles.fieldName}>{t('send-tx-detail.tx-basic.tx-hash')}</div>
      <div className={clsx(styles.fieldValue, styles.fullRow, styles.bold, styles.txHash)}>
        {tx.hash}
        <Copy onClick={onCopy} />
      </div>
      <div className={styles.fieldName}>{t('send-tx-detail.tx-basic.capacity')}</div>
      <div className={styles.fieldValue}>
        {`${showCapacity ? shannonToCKBFormatter(capacities) : HIDE_BALANCE} CKB`}
        <EyesOpen onClick={onChangeCapacityVisible} />
      </div>
      <div className={styles.fieldName}>{t('send-tx-detail.tx-basic.tx-fee')}</div>
      <div className={styles.fieldValue}>
        {`${showFee ? shannonToCKBFormatter(tx.fee) : HIDE_BALANCE} CKB`}
        <EyesOpen onClick={onChangeFeeVisible} />
      </div>
      <div className={styles.fieldName}>{t('send-tx-detail.tx-basic.size')}</div>
      <div className={clsx(styles.fieldValue, styles.fullRow)}>{`${tx.size} Bytes`}</div>
    </div>
  )
}

const SendTxDetail = () => {
  const {
    app: {
      pageNotice,
      send: { generatedTx },
    },
    wallet,
    chain: { networkID },
    settings: { networks },
  } = useGlobalState()
  const isMainnet = isMainnetUtils(networks, networkID)
  const [t] = useTranslation()
  const onGoBack = useGoBack()
  const tabs = [
    { id: TabId.Basic, label: t('send-tx-detail.basic-info') },
    { id: TabId.Topology, label: t('send-tx-detail.topology') },
  ]
  const [currentTab, setCurrentTab] = useState(tabs[0])
  const navigate = useNavigate()
  const onGotoView = useCallback(() => {
    navigate(RoutePath.Overview)
  }, [navigate])
  if (!generatedTx) {
    return null
  }
  return (
    <PageContainer
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      head={
        <div>
          <GoBack className={styles.goBack} onClick={onGoBack} />
          <span className={styles.breadcrumbNav}>{`${t('send-tx-detail.page-title')}`}</span>
        </div>
      }
      notice={pageNotice}
    >
      <div className={styles.tx}>
        <Tabs
          tabs={tabs}
          onTabChange={setCurrentTab}
          tabsClassName={styles.tabsClassName}
          tabsWrapClassName={styles.tabsWrapClassName}
          tabsColumnClassName={styles.tabsColumnClassName}
          activeColumnClassName={styles.active}
        />
        {currentTab.id === TabId.Basic ? (
          <TxBasic tx={generatedTx} />
        ) : (
          <TxTopology tx={generatedTx} isMainnet={isMainnet} />
        )}
      </div>
      <div className={styles.password}>
        <PasswordRequestInPage actionType="send" walletID={wallet.id} onCancel={onGotoView} />
      </div>
    </PageContainer>
  )
}

SendTxDetail.displayName = 'SendTxDetail'

export default SendTxDetail
