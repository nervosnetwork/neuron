import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, DefaultButton, Icon, TooltipHost, Spinner } from 'office-ui-fabric-react'
import PropertyList from 'widgets/PropertyList'

import appState from 'states/initStates/app'
import { AppActions, StateWithDispatch } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'

import calculateGlobalAPC from 'utils/calculateGlobalAPC'
import calculateFee from 'utils/calculateFee'
import { shannonToCKBFormatter, CKBToShannonFormatter } from 'utils/formatters'
import { MIN_DEPOSIT_AMOUNT, MEDIUM_FEE_RATE, SHANNON_CKB_RATIO, MAX_DECIMAL_DIGITS, CapacityUnit } from 'utils/const'
import { verifyAmount } from 'utils/validators'

import { generateDepositTx, generateWithdrawTx, generateClaimTx } from 'services/remote'
import { ckbCore, getHeaderByNumber } from 'services/chain'
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

        generateDepositTx({
          feeRate: `${MEDIUM_FEE_RATE}`,
          capacity: CKBToShannonFormatter(value, CapacityUnit.CKB),
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
      }, 500)
      setDepositValue(value)
    },
    [clearGeneratedTx, dispatch, wallet.id, t]
  )

  useEffect(() => {
    updateNervosDaoData({ walletID: wallet.id })(dispatch)
    updateDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    getHeaderByNumber('0x0')
      .then(header => setGenesisBlockTimestamp(+header.timestamp))
      .catch(err => console.error(err))
    return () => {
      clearNervosDaoData()(dispatch)
      clearGeneratedTx()
    }
  }, [clearGeneratedTx, dispatch, updateDepositValue, wallet.id])

  useEffect(() => {
    if (tipBlockTimestamp) {
      calculateGlobalAPC(tipBlockTimestamp, genesisBlockTimestamp)
        .then(apc => {
          setGlobalAPC(apc)
        })
        .catch(err => console.error(err))
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
    setErrorMessage('')
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
            setErrorMessage(`${typeof res.message === 'string' ? res.message : res.message.content}`)
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
                setErrorMessage(`${typeof res.message === 'string' ? res.message : res.message.content}`)
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
              index: BigInt(depositOutPoint.index),
            }
          : {
              txHash: outPoint.txHash,
              index: BigInt(outPoint.index),
            }
        return (ckbCore.rpc as any).calculateDaoMaximumWithdraw(formattedDepositOutPoint, withdrawBlockHash) as string
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
                epoch={epoch}
                genesisBlockTimestamp={genesisBlockTimestamp}
                connectionStatus={connectionStatus}
              />
            )
          })}
        </Stack>
      </>
    )
  }, [records, withdrawList, t, onActionClick, tipBlockNumber, epoch, connectionStatus, genesisBlockTimestamp])

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
              disabled={connectionStatus === 'offline' || sending}
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
        onSlide={(value: number) => updateDepositValue(`${value}`)}
        balance={wallet.balance}
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
