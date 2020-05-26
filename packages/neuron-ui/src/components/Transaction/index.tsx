import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'services/localCache'
import {
  getSystemCodeHash,
  getTransaction,
  showErrorMessage,
  getAllNetworks,
  getCurrentNetworkID,
  openExternal,
} from 'services/remote'
import { ckbCore } from 'services/chain'

import { transactionState } from 'states/init/chain'
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
  const [systemCodeHash, setSystemCodeHash] = useState<string>('')
  const [transaction, setTransaction] = useState(transactionState)
  const [isMainnet, setIsMainnet] = useState(false)
  const [error, setError] = useState({ code: '', message: '' })

  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet
  const hash = useMemo(() => window.location.href.split('/').pop(), [])

  useOnLocaleChange(i18n)

  useEffect(() => {
    window.document.title = i18n.t(`transaction.window-title`, { hash })
    // eslint-disable-next-line
  }, [i18n.language, hash])

  useEffect(() => {
    getSystemCodeHash().then(res => {
      if (isSuccessResponse(res)) {
        setSystemCodeHash(res.result)
      }
    })
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

  const onExplorerBtnClick = useCallback(() => {
    const explorerUrl = isMainnet ? 'https://explorer.nervos.org' : 'https://explorer.nervos.org/aggron'
    openExternal(`${explorerUrl}/transaction/${transaction.hash}`)
  }, [transaction.hash, isMainnet])

  const basicInfoItems = useMemo(() => {
    const balance = shannonToCKBFormatter(transaction.value)

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
          <CopyZone content={balance.replace(/,/g, '')} name={t('history.copy-balance')}>
            {`${balance} CKB`}
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

  const renderList = useCallback(
    (cells: Readonly<(State.DetailedInput | State.DetailedOutput)[]>) =>
      cells.map((cell, index) => {
        let address = ''
        if (!cell.lock) {
          address = t('transaction.cell-from-cellbase')
        } else {
          try {
            if (cell.lock.codeHash === systemCodeHash && cell.lock.hashType === 'type') {
              address = ckbCore.utils.bech32Address(cell.lock.args, {
                prefix: addressPrefix,
                type: ckbCore.utils.AddressType.HashIdx,
                codeHashOrCodeHashIndex: '0x00',
              })
            } else {
              address = ckbCore.utils.fullPayloadToAddress({
                arg: cell.lock.args,
                prefix: addressPrefix,
                type:
                  cell.lock.hashType === 'data'
                    ? ckbCore.utils.AddressType.DataCodeHash
                    : ckbCore.utils.AddressType.TypeCodeHash,
                codeHash: cell.lock.codeHash,
              })
            }
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
                {address}
              </CopyZone>
            </td>
            <td>
              <CopyZone content={capacity.replace(/,/g, '')} name={t('history.copy-balance')}>
                {`${capacity} CKB`}
              </CopyZone>
            </td>
          </tr>
        )
      }),
    [t, addressPrefix, systemCodeHash]
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

      <button
        type="button"
        className={styles.explorerNavButton}
        title={t('transaction.view-in-explorer-button-title')}
        onClick={onExplorerBtnClick}
      >
        <Icon iconName="Explorer" />
        <span>{t('transaction.view-in-explorer')}</span>
      </button>
    </div>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
