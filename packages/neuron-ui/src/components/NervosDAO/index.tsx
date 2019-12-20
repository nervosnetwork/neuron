import React, { useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Icon, TooltipHost, Spinner } from 'office-ui-fabric-react'

import appState from 'states/initStates/app'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import calculateFee from 'utils/calculateFee'
import { shannonToCKBFormatter } from 'utils/formatters'
import { MIN_DEPOSIT_AMOUNT } from 'utils/const'

import { epochParser } from 'utils/parsers'

import DepositDialog from 'components/DepositDialog'
import WithdrawDialog from 'components/WithdrawDialog'
import DAORecord from 'components/NervosDAORecord'
import CompensationPeriodDialog from 'components/CompensationPeriodDialog'
import Button from 'widgets/Button'

import hooks from './hooks'
import styles from './nervosDAO.module.scss'

const NervosDAO = ({
  app: {
    send = appState.send,
    loadings: { sending = false },
    tipBlockNumber,
    tipBlockHash,
    tipBlockTimestamp,
    epoch,
  },
  wallet,
  dispatch,
  nervosDAO: { records },
  chain: { connectionStatus },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const [depositValue, setDepositValue] = useState(`${MIN_DEPOSIT_AMOUNT}`)
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [activeRecord, setActiveRecord] = useState<State.NervosDAORecord | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [withdrawList, setWithdrawList] = useState<(string | null)[]>([])
  const [globalAPC, setGlobalAPC] = useState(0)
  const [genesisBlockTimestamp, setGenesisBlockTimestamp] = useState<number | undefined>(undefined)
  const [blockHashInCompensationDialog, setBlockHashInCompensationPeriodDialog] = useState('')
  const [maxDepositAmount, setMaxDepositAmount] = useState<bigint>(BigInt(wallet.balance))
  const [maxDepositTx, setMaxDepositTx] = useState<any>(undefined)
  const [maxDepositErrorMessage, setMaxDepositErrorMessage] = useState('')
  const [depositEpochList, setDepositEpochList] = useState<(string | null)[]>([])
  const clearGeneratedTx = hooks.useClearGeneratedTx(dispatch)
  const updateDepositValue = hooks.useUpdateDepositValue({
    setDepositValue,
    setErrorMessage,
    clearGeneratedTx,
    maxDepositAmount,
    maxDepositTx,
    dispatch,
    walletID: wallet.id,
    maxDepositErrorMessage,
    t,
  })
  const onDepositDialogDismiss = hooks.useOnDepositDialogDismiss({
    setShowDepositDialog,
    setDepositValue,
    setErrorMessage,
  })

  const onDepositDialogSubmit = hooks.useOnDepositDialogSubmit({
    setShowDepositDialog,
    setDepositValue,
    dispatch,
    walletID: wallet.id,
  })
  const onWithdrawDialogDismiss = hooks.useOnWithdrawDialogDismiss(setActiveRecord)

  hooks.useUpdateMaxDeposit({ wallet, setMaxDepositAmount, setMaxDepositTx, setMaxDepositErrorMessage })
  hooks.useInitData({ clearGeneratedTx, dispatch, updateDepositValue, wallet, setGenesisBlockTimestamp })
  hooks.useUpdateGlobalAPC({ tipBlockTimestamp, genesisBlockTimestamp, setGlobalAPC })
  const onWithdrawDialogSubmit = hooks.useOnWithdrawDialogSubmit({
    activeRecord,
    setActiveRecord,
    clearGeneratedTx,
    walletID: wallet.id,
    dispatch,
  })

  const onCompensationPeriodExplanationClick = hooks.useOnCompensationPeriodExplanationClick(
    setBlockHashInCompensationPeriodDialog
  )
  const onCompensationPeriodDialogDismiss = hooks.useOnCompensationPeriodDialogDismiss(
    setBlockHashInCompensationPeriodDialog
  )
  const onActionClick = hooks.useOnActionClick({
    records,
    clearGeneratedTx,
    dispatch,
    walletID: wallet.id,
    setActiveRecord,
  })

  const onSlide = hooks.useOnSlide({ updateDepositValue, maxDepositAmount })
  hooks.useUpdateDepositEpochList({ records, setDepositEpochList, connectionStatus })
  const compensationPeriods = hooks.useCompensationPeriods({ depositEpochList, currentEpoch: epoch })

  const fee = `${shannonToCKBFormatter(
    send.generatedTx ? send.generatedTx.fee || calculateFee(send.generatedTx) : '0'
  )} CKB`
  hooks.useUpdateWithdrawList({
    records,
    tipBlockHash,
    setWithdrawList,
  })

  const MemoizedRecords = useMemo(() => {
    return (
      <>
        <h2 className={styles.recordsTitle}>{t('nervos-dao.deposit-records')}</h2>
        <Stack>
          {records.map((record, i) => {
            let stage = 'deposited'
            if (record.depositOutPoint) {
              stage = 'withdrawing'
            }
            return (
              <DAORecord
                {...record}
                compensationPeriod={compensationPeriods[i]}
                withdraw={withdrawList[i]}
                actionLabel={t(`nervos-dao.${stage}-action-label`)}
                key={JSON.stringify(record.outPoint)}
                onClick={onActionClick}
                onCompensationPeriodExplanationClick={onCompensationPeriodExplanationClick}
                tipBlockNumber={tipBlockNumber}
                tipBlockTimestamp={tipBlockTimestamp}
                epoch={epoch}
                genesisBlockTimestamp={genesisBlockTimestamp}
                connectionStatus={connectionStatus}
                dispatch={dispatch}
              />
            )
          })}
        </Stack>
      </>
    )
  }, [
    records,
    withdrawList,
    t,
    onActionClick,
    onCompensationPeriodExplanationClick,
    tipBlockNumber,
    epoch,
    compensationPeriods,
    connectionStatus,
    genesisBlockTimestamp,
    tipBlockTimestamp,
    dispatch,
  ])

  const MemoizedDepositDialog = useMemo(() => {
    return (
      <DepositDialog
        show={showDepositDialog}
        value={depositValue}
        fee={fee}
        onChange={(_e: any, value: string) => updateDepositValue(value)}
        onDismiss={onDepositDialogDismiss}
        onSubmit={onDepositDialogSubmit}
        onSlide={onSlide}
        maxDepositAmount={maxDepositAmount}
        isDepositing={sending}
        errorMessage={errorMessage}
      />
    )
  }, [
    showDepositDialog,
    depositValue,
    fee,
    onDepositDialogDismiss,
    onDepositDialogSubmit,
    onSlide,
    maxDepositAmount,
    sending,
    errorMessage,
  ])

  const MemoizedWithdrawDialog = useMemo(() => {
    return activeRecord ? (
      <WithdrawDialog
        record={activeRecord}
        onDismiss={onWithdrawDialogDismiss}
        onSubmit={onWithdrawDialogSubmit}
        tipBlockHash={tipBlockHash}
        currentEpoch={epoch}
      />
    ) : null
  }, [activeRecord, onWithdrawDialogDismiss, onWithdrawDialogSubmit, tipBlockHash, epoch])

  const MemoizedCompensationPeriodDialog = useMemo(() => {
    const index = records.findIndex(r => r.blockHash === blockHashInCompensationDialog)
    const compensationPeriod = compensationPeriods[index] || null
    return (
      <CompensationPeriodDialog compensationPeriod={compensationPeriod} onDismiss={onCompensationPeriodDialogDismiss} />
    )
  }, [records, blockHashInCompensationDialog, onCompensationPeriodDialogDismiss, compensationPeriods])

  const free = BigInt(wallet.balance)
  const locked = withdrawList.reduce((acc, w) => acc + BigInt(w || 0), BigInt(0))

  const EpochInfo = useMemo(() => {
    if (!epoch) {
      return <Spinner />
    }
    const epochInfo = epochParser(epoch)
    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <Text as="span" variant="small" block>{`Epoch number: ${epochInfo.number}`}</Text>
        <Text as="span" variant="small" block>{`Epoch index: ${epochInfo.index}`}</Text>
        <Text as="span" variant="small" block>{`Epoch length: ${epochInfo.length}`}</Text>
        <Text as="span" variant="small" block>{`APC: ~${globalAPC}%`}</Text>
      </Stack>
    )
  }, [epoch, globalAPC])

  const lockAndFreeProperties = [
    {
      label: t('nervos-dao.free'),
      value: `${shannonToCKBFormatter(`${free}`)} CKB`,
    },
    {
      label: t('nervos-dao.locked'),
      value: `${shannonToCKBFormatter(`${locked}`)} CKB`,
    },
  ]

  return (
    <div className={styles.nervosDAOContainer}>
      <div className={styles.amount}>
        {lockAndFreeProperties.map(({ label, value }) => (
          <div key={label} title={label} aria-label={label} className={styles.amountProperty}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className={styles.deposit}>
        <div>
          <Button
            type="confirm"
            aria-label={t('nervos-dao.deposit')}
            disabled={connectionStatus === 'offline' || sending || !maxDepositTx}
            onClick={() => setShowDepositDialog(true)}
            label={t('nervos-dao.deposit')}
          />
          <TooltipHost
            content={EpochInfo}
            styles={{ root: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: 9 } }}
          >
            <Icon iconName="info" />
          </TooltipHost>
        </div>
      </div>
      <div className={styles.records}>{MemoizedRecords}</div>
      {MemoizedDepositDialog}
      {MemoizedWithdrawDialog}
      {MemoizedCompensationPeriodDialog}
    </div>
  )
}

NervosDAO.displayName = 'NervosDAOao'

export default NervosDAO
