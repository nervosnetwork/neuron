import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { currentWallet as currentWalletCache } from 'services/localCache'
import { getTransaction, showErrorMessage, getAllNetworks, getCurrentNetworkID } from 'services/remote'
import { transactionState } from 'states'
import LockInfoDialog from 'components/LockInfoDialog'
import ScriptTag from 'components/ScriptTag'

import {
  useOnLocaleChange,
  ErrorCode,
  CONSTANTS,
  localNumberFormatter,
  uniformTimeFormatter,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  isSuccessResponse,
} from 'utils'
import CopyZone from 'widgets/CopyZone'

import styles from './transaction.module.scss'

const { MAINNET_TAG } = CONSTANTS

const Transaction = () => {
  const [t, i18n] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [isMainnet, setIsMainnet] = useState(false)
  const [error, setError] = useState({ code: '', message: '' })
  const [lockInfo, setLockInfo] = useState<CKBComponents.Script | null>(null)

  const hash = useMemo(() => window.location.href.split('/').pop(), [])

  useOnLocaleChange(i18n)

  useEffect(() => {
    window.document.title = i18n.t(`transaction.window-title`, { hash })
    // eslint-disable-next-line
  }, [i18n.language, hash])

  useEffect(() => {
    Promise.all([getAllNetworks(), getCurrentNetworkID()])
      .then(([networksRes, idRes]) => {
        if (isSuccessResponse(networksRes) && isSuccessResponse(idRes)) {
          const network = networksRes.result.find((n: any) => n.id === idRes.result)
          if (!network) {
            throw new Error('Cannot find current network in the network list')
          }

          setIsMainnet(network.chain === MAINNET_TAG)
        }
      })
      .catch(err => console.warn(err))

    const currentWallet = currentWalletCache.load()
    if (currentWallet) {
      if (!hash) {
        showErrorMessage(
          t(`messages.error`),
          t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction hash' })
        )
        return
      }
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (isSuccessResponse(res)) {
            setTransaction(res.result)
          } else {
            showErrorMessage(
              t(`messages.error`),
              t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })
            )
            window.close()
          }
        })
        .catch((err: Error) => {
          setError({
            code: '-1',
            message: err.message,
          })
        })
    }
  }, [t, hash])

  useExitOnWalletChange()

  const basicInfoItems = useMemo(() => {
    return [
      {
        label: t('transaction.transaction-hash'),
        value:
          (
            <CopyZone content={transaction.hash} name={t('history.copy-tx-hash')}>
              {transaction.hash}
            </CopyZone>
          ) || 'none',
      },
      {
        label: t('transaction.block-number'),
        value: transaction.blockNumber ? localNumberFormatter(transaction.blockNumber) : 'none',
      },
      {
        label: t('transaction.date'),
        value: +(transaction.timestamp || transaction.createdAt)
          ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
          : 'none',
      },
      {
        label: t('transaction.income'),
        value: (
          <CopyZone content={shannonToCKBFormatter(transaction.value, false, '')} name={t('history.copy-balance')}>
            {`${shannonToCKBFormatter(transaction.value)} CKB`}
          </CopyZone>
        ),
      },
    ]
  }, [t, transaction])

  const inputsTitle = useMemo(
    () => `${t('transaction.inputs')} (${transaction.inputs.length}/${localNumberFormatter(transaction.inputsCount)})`,
    [transaction.inputs.length, transaction.inputsCount, t]
  )

  const outputsTitle = useMemo(() => {
    return `${t('transaction.outputs')} (${transaction.outputs.length}/${localNumberFormatter(
      transaction.outputsCount
    )})`
  }, [transaction.outputs.length, transaction.outputsCount, t])

  const renderLockInfoDialog = useCallback(() => {
    if (!lockInfo) {
      return null
    }
    return <LockInfoDialog lockInfo={lockInfo} isMainnet={isMainnet} onDismiss={() => setLockInfo(null)} />
  }, [lockInfo, isMainnet])

  const renderList = useCallback(
    (cells: Readonly<(State.DetailedInput | State.DetailedOutput)[]>) =>
      cells.map((cell, index) => {
        let address = ''
        if (!cell.lock) {
          address = t('transaction.cell-from-cellbase')
        } else {
          try {
            address = scriptToAddress(cell.lock, isMainnet)
          } catch (err) {
            console.error(err)
          }
        }
        const capacity = shannonToCKBFormatter(cell.capacity || '0')

        return (
          <tr key={cell.lockHash || ''} data-address={address}>
            <td title={`${index}`}>{index}</td>
            <td title={address} className={styles.addressCell}>
              <CopyZone content={address} name={t('history.copy-address')}>
                {`${address.slice(0, 20)}...${address.slice(-20)}`}
              </CopyZone>
              <ScriptTag isMainnet={isMainnet} script={cell.lock} onClick={() => setLockInfo(cell.lock)} />
            </td>
            <td>
              <CopyZone content={capacity.replace(/,/g, '')} name={t('history.copy-balance')}>
                {`${capacity} CKB`}
              </CopyZone>
            </td>
          </tr>
        )
      }),
    [t, isMainnet]
  )

  if (error.code) {
    return (
      <div className={styles.error}>
        {error.message || t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2
        className={styles.infoTitle}
        title={t('history.basic-information')}
        aria-label={t('history.basic-information')}
      >
        {t('history.basic-information')}
      </h2>
      <div className={styles.infoDetail}>
        {basicInfoItems.map(({ label, value }) => (
          <div key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <h2 className={styles.inputsTitle} title={inputsTitle} aria-label={inputsTitle}>
        {inputsTitle}
      </h2>
      <table className={styles.inputList}>
        <thead>
          <tr>
            {['index', 'address', 'amount'].map(field => (
              <th key={field}>{t(`transaction.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>{renderList(transaction.inputs)}</tbody>
      </table>
      <h2 className={styles.outputsTitle} title={outputsTitle} aria-label={outputsTitle}>
        {outputsTitle}
      </h2>
      <table className={styles.outputList}>
        <thead>
          <tr>
            {['index', 'address', 'amount'].map(field => (
              <th key={field}>{t(`transaction.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>{renderList(transaction.outputs)}</tbody>
      </table>
      {renderLockInfoDialog()}
    </div>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
