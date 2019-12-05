import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, DefaultButton, Icon, TooltipHost, Spinner } from 'office-ui-fabric-react'
import PropertyList from 'widgets/PropertyList'

import appState from 'states/initStates/app'
import { AppActions, StateWithDispatch } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'

import calculateAPC from 'utils/calculateAPC'
import calculateFee from 'utils/calculateFee'
import { shannonToCKBFormatter, CKBToShannonFormatter } from 'utils/formatters'
import {
  MIN_AMOUNT,
  MIN_DEPOSIT_AMOUNT,
  MEDIUM_FEE_RATE,
  SHANNON_CKB_RATIO,
  MAX_DECIMAL_DIGITS,
  MILLISECONDS_IN_YEAR,
  CapacityUnit,
} from 'utils/const'
import { verifyAmount } from 'utils/validators'

import { generateDepositTx, generateDepositAllTx, generateWithdrawTx, generateClaimTx } from 'services/remote'
import { getHeaderByNumber, calculateDaoMaximumWithdraw } from 'services/chain'
import { epochParser } from 'utils/parsers'

import DAORecord from 'components/CustomRows/DAORecordRow'

import DepositDialog from './DepositDialog'
import WithdrawDialog from './WithdrawDialog'

let timer: NodeJS.Timeout

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
  const [maxDepositAmount, setMaxDepositAmount] = useState<bigint>(BigInt(wallet.balance))
  const [maxDepositTx, setMaxDepositTx] = useState<any>(undefined)
  const [maxDepositErrorMessage, setMaxDepositErrorMessage] = useState('')

  const clearGeneratedTx = useCallback(() => {
    dispatch({
      type: AppActions.ClearSendState,
      payload: null,
    })
  }, [dispatch])

  const updateDepositValue = useCallback(
    (value: string) => {
      if (Number.isNaN(+value) || /[^\d.]/.test(value) || +value < 0) {
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        setErrorMessage('')
        clearGeneratedTx()

        const verifyRes = verifyAmount(value)
        if (verifyRes !== true) {
          setErrorMessage(t(`messages.codes.${verifyRes.code}`, { fieldName: 'deposit', length: MAX_DECIMAL_DIGITS }))
          return
        }

        if (BigInt(CKBToShannonFormatter(value)) < BigInt(MIN_DEPOSIT_AMOUNT * SHANNON_CKB_RATIO)) {
          setErrorMessage(t('nervos-dao.minimal-fee-required', { minimal: MIN_DEPOSIT_AMOUNT }))
          return
        }

        const capacity = CKBToShannonFormatter(value, CapacityUnit.CKB)
        if (BigInt(capacity) < maxDepositAmount) {
          generateDepositTx({
            feeRate: `${MEDIUM_FEE_RATE}`,
            capacity,
            walletID: wallet.id,
          }).then(res => {
            if (res.status === 1) {
              dispatch({
                type: AppActions.UpdateGeneratedTx,
                payload: res.result,
              })
            } else {
              setErrorMessage(`${typeof res.message === 'string' ? res.message : res.message.content}`)
            }
          })
        } else {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: maxDepositTx,
          })
          setErrorMessage(maxDepositErrorMessage)
        }
      }, 500)
      setDepositValue(value)
    },
    [clearGeneratedTx, maxDepositAmount, maxDepositTx, dispatch, wallet.id, maxDepositErrorMessage, t]
  )

  useEffect(() => {
    updateNervosDaoData({ walletID: wallet.id })(dispatch)
    updateDepositValue(
      `${
        BigInt(wallet.balance) > BigInt(CKBToShannonFormatter(`${MIN_DEPOSIT_AMOUNT}`))
          ? BigInt(MIN_DEPOSIT_AMOUNT)
          : BigInt(0)
      }`
    )
    getHeaderByNumber('0x0')
      .then(header => setGenesisBlockTimestamp(+header.timestamp))
      .catch(err => console.error(err))
    return () => {
      clearNervosDaoData()(dispatch)
      clearGeneratedTx()
    }
  }, [clearGeneratedTx, dispatch, updateDepositValue, wallet.id, wallet.balance])

  useEffect(() => {
    generateDepositAllTx({
      walletID: wallet.id,
      feeRate: `${MEDIUM_FEE_RATE}`,
    })
      .then(res => {
        if (res.status === 1) {
          const fee = BigInt(res.result.fee)
          const maxValue = fee < BigInt(wallet.balance) ? BigInt(wallet.balance) - fee : BigInt(0)
          setMaxDepositAmount(maxValue)
          setMaxDepositTx(res.result)
          setMaxDepositErrorMessage('')
        } else {
          throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
        }
      })
      .catch(err => {
        setMaxDepositAmount(BigInt(0))
        setMaxDepositTx(undefined)
        setMaxDepositErrorMessage(err.message)
      })
  }, [wallet.id, wallet.balance])

  useEffect(() => {
    if (tipBlockTimestamp) {
      const endYearNumber = (tipBlockTimestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      try {
        const apc = calculateAPC({
          startYearNumber: 0,
          endYearNumber,
        })
        setGlobalAPC(apc)
      } catch (err) {
        console.error(err)
      }
    }
  }, [tipBlockTimestamp, genesisBlockTimestamp])

  const onDepositDialogDismiss = () => {
    setShowDepositDialog(false)
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    setErrorMessage('')
  }

  const onDepositDialogSubmit = () => {
    setShowDepositDialog(false)
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    dispatch({
      type: AppActions.RequestPassword,
      payload: {
        walletID: wallet.id,
        actionType: 'send',
      },
    })
  }

  const onWithdrawDialogDismiss = () => {
    setActiveRecord(null)
  }

  const onWithdrawDialogSubmit = () => {
    if (activeRecord) {
      generateWithdrawTx({
        walletID: wallet.id,
        outPoint: activeRecord.outPoint,
        feeRate: `${MEDIUM_FEE_RATE}`,
      })
        .then((res: any) => {
          if (res.status === 1) {
            dispatch({
              type: AppActions.UpdateGeneratedTx,
              payload: res.result,
            })
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID: wallet.id,
                actionType: 'send',
              },
            })
          } else {
            clearGeneratedTx()
            throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
          }
        })
        .catch((err: Error) => {
          dispatch({
            type: AppActions.AddNotification,
            payload: {
              type: 'alert',
              timestamp: +new Date(),
              content: err.message,
            },
          })
        })
    }
    setActiveRecord(null)
  }

  const onActionClick = useCallback(
    (e: any) => {
      const { dataset } = e.target
      const outPoint = {
        txHash: dataset.txHash,
        index: dataset.index,
      }
      const record = records.find(r => r.outPoint.txHash === outPoint.txHash && r.outPoint.index === outPoint.index)
      if (record) {
        if (record.depositOutPoint) {
          generateClaimTx({
            walletID: wallet.id,
            withdrawingOutPoint: record.outPoint,
            depositOutPoint: record.depositOutPoint,
            feeRate: `${MEDIUM_FEE_RATE}`,
          })
            .then((res: any) => {
              if (res.status === 1) {
                dispatch({
                  type: AppActions.UpdateGeneratedTx,
                  payload: res.result,
                })
                dispatch({
                  type: AppActions.RequestPassword,
                  payload: {
                    walletID: wallet.id,
                    actionType: 'send',
                  },
                })
              } else {
                clearGeneratedTx()
                throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
              }
            })
            .catch((err: Error) => {
              dispatch({
                type: AppActions.AddNotification,
                payload: {
                  type: 'alert',
                  timestamp: +new Date(),
                  content: err.message,
                },
              })
            })
        } else {
          setActiveRecord(record)
        }
      }
    },
    [records, clearGeneratedTx, dispatch, wallet.id]
  )

  const onSlide = useCallback(
    (value: number) => {
      const amount =
        maxDepositAmount - BigInt(CKBToShannonFormatter(`${value}`)) < BigInt(SHANNON_CKB_RATIO * MIN_AMOUNT)
          ? shannonToCKBFormatter(`${maxDepositAmount}`, false, '')
          : `${value}`
      updateDepositValue(amount)
    },
    [updateDepositValue, maxDepositAmount]
  )

  const fee = `${shannonToCKBFormatter(
    send.generatedTx ? send.generatedTx.fee || calculateFee(send.generatedTx) : '0'
  )} CKB`

  useEffect(() => {
    Promise.all(
      records.map(async ({ outPoint, depositOutPoint, blockHash }) => {
        if (!tipBlockHash) {
          return null
        }
        const withdrawBlockHash = depositOutPoint ? blockHash : tipBlockHash
        const formattedDepositOutPoint = depositOutPoint
          ? {
              txHash: depositOutPoint.txHash,
              index: `0x${BigInt(depositOutPoint.index).toString(16)}`,
            }
          : {
              txHash: outPoint.txHash,
              index: `0x${BigInt(outPoint.index).toString(16)}`,
            }
        return calculateDaoMaximumWithdraw(formattedDepositOutPoint, withdrawBlockHash).catch(() => null)
      })
    )
      .then(res => {
        setWithdrawList(res)
      })
      .catch(console.error)
  }, [records, tipBlockHash])

  const Records = useMemo(() => {
    return (
      <>
        <Text as="h2" variant="xxLarge">
          {t('nervos-dao.deposit-records')}
        </Text>
        <Stack>
          {records.map((record, i) => {
            let stage = 'deposited'
            if (record.depositOutPoint) {
              stage = 'withdrawing'
            }
            return (
              <DAORecord
                {...record}
                withdraw={withdrawList[i]}
                actionLabel={t(`nervos-dao.${stage}-action-label`)}
                key={JSON.stringify(record.outPoint)}
                onClick={onActionClick}
                tipBlockNumber={tipBlockNumber}
                tipBlockTimestamp={tipBlockTimestamp}
                epoch={epoch}
                genesisBlockTimestamp={genesisBlockTimestamp}
                connectionStatus={connectionStatus}
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
    tipBlockNumber,
    epoch,
    connectionStatus,
    genesisBlockTimestamp,
    tipBlockTimestamp,
  ])

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
    <>
      <Stack tokens={{ childrenGap: 15 }} horizontalAlign="stretch">
        <Text as="h1" variant="xxLarge">
          {wallet.name}
        </Text>
        <Stack horizontal tokens={{ childrenGap: 15 }}>
          <Stack style={{ minWidth: '250px' }} tokens={{ childrenGap: 10 }}>
            <PropertyList properties={lockAndFreeProperties} />
          </Stack>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 15 }}>
            <DefaultButton
              text={t('nervos-dao.deposit')}
              disabled={connectionStatus === 'offline' || sending || !maxDepositTx}
              onClick={() => setShowDepositDialog(true)}
            />
            <TooltipHost
              content={EpochInfo}
              styles={{ root: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
            >
              <Icon iconName="info" />
            </TooltipHost>
          </Stack>
        </Stack>
        {Records}
      </Stack>
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
      {activeRecord ? (
        <WithdrawDialog
          record={activeRecord}
          onDismiss={onWithdrawDialogDismiss}
          onSubmit={onWithdrawDialogSubmit}
          tipBlockHash={tipBlockHash}
          currentEpoch={epoch}
        />
      ) : null}
    </>
  )
}

NervosDAO.displayName = 'NervosDAOao'

export default NervosDAO
