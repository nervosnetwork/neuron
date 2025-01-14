import React, { useState, useMemo } from 'react'
import { useState as useGlobalState, useDispatch } from 'states'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MultisigConfig } from 'services/remote'
import { clsx, useClearGeneratedTx } from 'utils'
import Dialog from 'widgets/Dialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import TableNoData from 'widgets/Icons/TableNoData.png'

import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import hooks from './hooks'
import styles from './multisigAddressNervosDAODialog.module.scss'

const MultisigAddressNervosDAODialog = ({
  multisigConfig,
  closeDialog,
}: {
  multisigConfig: MultisigConfig
  closeDialog: () => void
}) => {
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: { tipDao, tipBlockTimestamp, epoch },
    wallet,
    nervosDAO: { records },
    chain: { connectionStatus, networkID },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [t] = useTranslation()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const [activeRecord, setActiveRecord] = useState<State.NervosDAORecord | null>(null)
  const [withdrawList, setWithdrawList] = useState<Map<string, string | null>>(new Map())
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [depositEpochList, setDepositEpochList] = useState<Map<string, string | null>>(new Map())
  const clearGeneratedTx = useClearGeneratedTx()

  const canSign = hooks.useCanSign({ addresses: wallet.addresses, multisigConfig })

  const onWithdrawDialogDismiss = hooks.useOnWithdrawDialogDismiss(setActiveRecord)

  const genesisBlockHash = useMemo(() => networks.find(v => v.id === networkID)?.genesisHash, [networkID, networks])
  hooks.useInitData({
    clearGeneratedTx,
    dispatch,
    wallet,
    setGenesisBlockTimestamp,
    genesisBlockHash,
  })
  const onWithdrawDialogSubmit = hooks.useOnWithdrawDialogSubmit({
    activeRecord,
    setActiveRecord,
    clearGeneratedTx,
    walletID: wallet.id,
    dispatch,
    suggestFeeRate,
  })

  const onActionClick = hooks.useOnActionClick({
    records,
    clearGeneratedTx,
    dispatch,
    walletID: wallet.id,
    setActiveRecord,
    navigate,
  })

  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })

  hooks.useUpdateWithdrawList({
    records,
    tipDao,
    setWithdrawList,
  })

  const MemoizedRecords = useMemo(() => {
    const onTabClick = (e: React.SyntheticEvent<HTMLDivElement, MouseEvent>) => {
      const {
        dataset: { idx },
      } = e.target as HTMLDivElement
      if (idx) {
        setTabIdx(idx)
      }
    }
    const filteredRecord = records.filter(record => {
      if (record.status === 'failed') {
        return false
      }

      if (tabIdx === '0') {
        return record.status !== 'dead'
      }
      return record.status === 'dead'
    })

    if (tabIdx === '0') {
      filteredRecord.sort((r1, r2) => +r2.depositInfo!.timestamp! - +r1.depositInfo!.timestamp!)
    } else if (tabIdx === '1') {
      filteredRecord.sort((r1, r2) => +r2.unlockInfo!.timestamp! - +r1.unlockInfo!.timestamp!)
    }

    return (
      <>
        <div className={styles.tabContainer}>
          <div
            role="presentation"
            className={styles.recordTab}
            style={{ '--selected-tab': tabIdx }}
            onClick={onTabClick}
          >
            <div className={styles.underline} />
            <button
              className={clsx({ [styles.active]: tabIdx === '0' }, styles.tab)}
              type="button"
              role="tab"
              data-idx="0"
            >
              {t('nervos-dao.deposit-records')}
            </button>
            <button
              className={clsx({ [styles.active]: tabIdx === '1' }, styles.tab)}
              type="button"
              role="tab"
              data-idx="1"
            >
              {t('nervos-dao.completed-records')}
            </button>
          </div>
        </div>
        {filteredRecord.length ? (
          <div className={styles.records}>
            {filteredRecord.map(record => {
              const key = record.depositOutPoint
                ? `${record.depositOutPoint.txHash}-${record.depositOutPoint.index}`
                : `${record.outPoint.txHash}-${record.outPoint.index}`
              const txHash = record.depositOutPoint ? record.depositOutPoint.txHash : record.outPoint.txHash

              const props: DAORecordProps = {
                ...record,
                tipBlockTimestamp,
                withdrawCapacity: withdrawList.get(key) || null,
                onClick: onActionClick,
                depositEpoch: depositEpochList.get(txHash) || '',
                currentEpoch: epoch,
                genesisBlockTimestamp,
                connectionStatus,
                hasCkbBalance: +wallet.balance > 0,
              }
              return (
                <div className={styles.recordWrap}>
                  <DAORecord key={key} {...props} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.noRecords}>
            <img src={TableNoData} alt="No Data" />
            {t(`nervos-dao.deposit-record.no-${tabIdx === '0' ? 'deposit' : 'completed'}`)}
          </div>
        )}
      </>
    )
  }, [
    records,
    withdrawList,
    t,
    onActionClick,
    epoch,
    connectionStatus,
    genesisBlockTimestamp,
    tipBlockTimestamp,
    depositEpochList,
    tabIdx,
    setTabIdx,
  ])

  const MemoizedWithdrawDialog = useMemo(() => {
    return activeRecord ? (
      <WithdrawDialog
        record={activeRecord}
        onDismiss={onWithdrawDialogDismiss}
        onSubmit={onWithdrawDialogSubmit}
        tipDao={tipDao}
        currentEpoch={epoch}
        canSign={canSign}
      />
    ) : null
  }, [activeRecord, onWithdrawDialogDismiss, onWithdrawDialogSubmit, tipDao, epoch, canSign])

  return (
    <Dialog
      show
      title={t('multisig-address.send-ckb.title')}
      onCancel={closeDialog}
      showFooter={false}
      contentClassName={styles.dialogContainer}
    >
      <div className={styles.container}>
        {MemoizedRecords}

        {MemoizedWithdrawDialog}
      </div>
    </Dialog>
  )
}

MultisigAddressNervosDAODialog.displayName = 'MultisigAddressNervosDAODialog'

export default MultisigAddressNervosDAODialog
