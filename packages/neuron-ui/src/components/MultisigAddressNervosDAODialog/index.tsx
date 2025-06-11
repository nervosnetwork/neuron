import React, { useState, useMemo, useEffect } from 'react'
import { useState as useGlobalState, useDispatch } from 'states'
import { useTranslation } from 'react-i18next'
import { MultisigConfig, getMultisigDaoData } from 'services/remote'
import { clsx, useClearGeneratedTx, isSuccessResponse, isMainnet as isMainnetUtil } from 'utils'
import Dialog from 'widgets/Dialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord, { DAORecordProps } from 'components/NervosDAORecord'
import TableNoData from 'widgets/Icons/TableNoData.png'
import { getHeader } from 'services/chain'

import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
import hooks from './hooks'
import styles from './multisigAddressNervosDAODialog.module.scss'

const MultisigAddressNervosDAODialog = ({
  balance,
  multisigConfig,
  closeDialog,
}: {
  balance: string
  multisigConfig: MultisigConfig
  closeDialog: () => void
}) => {
  const [tabIdx, setTabIdx] = useState('0')
  const {
    app: { tipDao, tipBlockTimestamp, epoch },
    wallet,
    chain: { connectionStatus, networkID },
    settings: { networks },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const [records, setRecords] = useState<State.NervosDAORecord[]>([])
  const [activeRecord, setActiveRecord] = useState<State.NervosDAORecord | null>(null)
  const [withdrawList, setWithdrawList] = useState<Map<string, string | null>>(new Map())
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [depositEpochList, setDepositEpochList] = useState<Map<string, string | null>>(new Map())
  const clearGeneratedTx = useClearGeneratedTx()

  const { canSign } = getMultisigSignStatus({ multisigConfig, addresses: wallet.addresses })

  const onWithdrawDialogDismiss = hooks.useOnWithdrawDialogDismiss(setActiveRecord)

  const genesisBlockHash = useMemo(() => networks.find(v => v.id === networkID)?.genesisHash, [networkID, networks])

  const onWithdrawDialogSubmit = hooks.useGenerateDaoWithdrawTx({
    activeRecord,
    setActiveRecord,
    clearGeneratedTx,
    walletID: wallet.id,
    dispatch,
    suggestFeeRate,
    multisigConfig,
  })

  const isMainnet = isMainnetUtil(networks, networkID)

  const onActionClick = hooks.useOnActionClick({
    records,
    clearGeneratedTx,
    dispatch,
    walletID: wallet.id,
    setActiveRecord,
    isMainnet,
    multisigConfig,
    suggestFeeRate,
  })

  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })

  useEffect(() => {
    getMultisigDaoData({ multisigConfig }).then(res => {
      if (isSuccessResponse(res)) {
        setRecords(res.result)
      }
    })
    const intervalId = setInterval(() => {
      getMultisigDaoData({ multisigConfig }).then(res => {
        if (isSuccessResponse(res)) {
          setRecords(res.result)
        }
      })
    }, 10000)
    if (genesisBlockHash) {
      getHeader(genesisBlockHash)
        .then(header => setGenesisBlockTimestamp(+header.timestamp))
        .catch(err => console.error(err))
    }
    return () => {
      clearInterval(intervalId)
      clearGeneratedTx()
    }
  }, [multisigConfig])

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
                hasCkbBalance: +balance > 0,
                showDetailInExplorer: true,
                isMainnet,
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
      title={t('multisig-address.nervos-dao')}
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
