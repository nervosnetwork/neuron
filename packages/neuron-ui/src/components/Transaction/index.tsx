import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'services/localCache'
import {
  getTransaction,
  showErrorMessage,
  getAllNetworks,
  getCurrentNetworkID,
  openExternal,
  openContextMenu,
} from 'services/remote'
import { ckbCore } from 'services/chain'

import { transactionState } from 'states/initStates/chain'

import { localNumberFormatter, uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { ErrorCode, MAINNET_TAG } from 'utils/const'
import styles from './transaction.module.scss'

const Transaction = () => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [isMainnet, setIsMainnet] = useState(false)
  const [error, setError] = useState({ code: '', message: '' })

  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet

  useEffect(() => {
    Promise.all([getAllNetworks(), getCurrentNetworkID()])
      .then(([networksRes, idRes]) => {
        if (networksRes.status === 1 && idRes.status === 1) {
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
      const hash = window.location.href.split('/').pop()
      if (!hash) {
        showErrorMessage(
          t(`messages.error`),
          t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction hash' })
        )
        return
      }
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (res.status) {
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
  }, [t])

  useEffect(() => {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'currentWallet') {
        window.close()
      }
    })
  }, [])

  const onExplorerBtnClick = useCallback(() => {
    const explorerUrl = isMainnet ? 'https://explorer.nervos.org' : 'https://explorer.nervos.org/aggron'
    openExternal(`${explorerUrl}/transaction/${transaction.hash}`)
  }, [transaction.hash, isMainnet])

  const basicInfoItems = useMemo(
    () => [
      { label: t('transaction.transaction-hash'), value: transaction.hash || 'none' },
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
        value: `${shannonToCKBFormatter(transaction.value)} CKB`,
      },
    ],
    [t, transaction]
  )

  const onInfoContextMenu = useCallback(
    (e: React.SyntheticEvent) => {
      const {
        dataset: { txHash },
      } = e.target as HTMLDivElement
      if (txHash) {
        const menuTemplate = [
          {
            label: t('common.copy-tx-hash'),
            click: () => {
              window.clipboard.writeText(txHash)
            },
          },
        ]
        openContextMenu(menuTemplate)
      }
    },
    [t]
  )

  const onCellContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const {
        dataset: { args },
      } = (e.target as HTMLTableCellElement).parentElement as HTMLTableRowElement
      if (args) {
        try {
          const address = ckbCore.utils.bech32Address(args, {
            prefix: addressPrefix,
            type: ckbCore.utils.AddressType.HashIdx,
            codeHashOrCodeHashIndex: '0x00',
          })
          const menuTemplate = [
            {
              label: t('common.copy-address'),
              click: () => {
                window.clipboard.writeText(address)
              },
            },
          ]
          openContextMenu(menuTemplate)
        } catch (err) {
          console.error(err)
        }
      }
    },
    [addressPrefix, t]
  )

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
            address = ckbCore.utils.bech32Address(cell.lock.args, {
              prefix: addressPrefix,
              type: ckbCore.utils.AddressType.HashIdx,
              codeHashOrCodeHashIndex: '0x00',
            })
          } catch (err) {
            console.error(err)
          }
        }

        return (
          <tr
            key={cell.lockHash || ''}
            data-args={(cell && cell.lock && cell.lock.args) || ''}
            onContextMenu={onCellContextMenu}
          >
            <td title={`${index}`}>{index}</td>
            <td title={address} className="monospacedFont">
              {address}
            </td>
            <td>{`${shannonToCKBFormatter(cell.capacity || '0')} CKB`}</td>
          </tr>
        )
      }),
    [t, onCellContextMenu, addressPrefix]
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
      <div className={styles.infoDetail} onContextMenu={onInfoContextMenu} data-tx-hash={transaction.hash}>
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
