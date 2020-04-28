import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'

import { StateDispatch } from 'states/stateProvider/reducer'
import { showTransactionDetails, openContextMenu, openExternal } from 'services/remote'

import { useLocalDescription } from 'utils/hooks'
import { shannonToCKBFormatter, uniformTimeFormatter as timeFormatter, localNumberFormatter } from 'utils/formatters'
import getExplorerUrl from 'utils/getExplorerUrl'
import { CONFIRMATION_THRESHOLD } from 'utils/const'
import styles from './transactionList.module.scss'

const TransactionList = ({
  items: txs,
  tipBlockNumber,
  walletID,
  isMainnet,
  dispatch,
}: {
  isLoading?: boolean
  walletID: string
  items: State.Transaction[]
  tipBlockNumber: string
  isMainnet: boolean
  dispatch: StateDispatch
}) => {
  const [txHash, setTxHash] = useState('')
  const [t] = useTranslation()

  const {
    localDescription,
    onDescriptionPress,
    onDescriptionFieldBlur,
    onDescriptionChange,
    onDescriptionSelected,
  } = useLocalDescription('transaction', walletID, dispatch)

  const onTxClick = useCallback(
    (e: React.SyntheticEvent<HTMLElement>) => {
      const {
        dataset: { hash = '' },
      } = e.target as HTMLElement
      setTxHash(currentHash => (currentHash === hash ? '' : hash))
    },
    [setTxHash]
  )

  const onContextMenu = useCallback(
    (e: React.SyntheticEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const {
        dataset: { hash },
      } = e.target as HTMLDivElement
      if (!hash) {
        return
      }
      const menuTemplate = [
        {
          label: t('history.detail'),
          click: () => {
            showTransactionDetails(hash)
          },
        },
        {
          label: t('history.copy-transaction-hash'),
          click: () => {
            window.clipboard.writeText(hash)
          },
        },
        {
          label: t('history.view-on-explorer'),
          click: () => {
            const explorerUrl = getExplorerUrl(isMainnet)
            openExternal(`${explorerUrl}/transaction/${hash}`)
          },
        },
      ]

      openContextMenu(menuTemplate)
    },
    [isMainnet, t]
  )

  const onDoubleClick = useCallback((e: React.SyntheticEvent<HTMLDivElement>) => {
    const {
      dataset: { hash },
    } = e.target as HTMLDivElement
    if (hash) {
      showTransactionDetails(hash)
    }
  }, [])

  return (
    <>
      {txs.map(tx => {
        const isSelected = localDescription.key === tx.hash

        const confirmations = 1 + +tipBlockNumber - +tx.blockNumber
        let status = tx.status as string
        if (status === 'success' && confirmations < CONFIRMATION_THRESHOLD) {
          status = 'confirming'
        }
        const statusLabel = t(`history.${status}`)
        const confirmationsLabel = t('history.confirming-with-count', {
          confirmations: localNumberFormatter(confirmations),
        })
        const typeLabel = tx.nervosDao ? 'Nervos DAO' : t(`history.${tx.type}`)
        return (
          <div key={tx.hash} data-is-open={txHash === tx.hash} className={styles.itemContainer}>
            <div
              tabIndex={0}
              role="button"
              className={styles.summary}
              data-hash={tx.hash}
              data-status={status}
              onClick={onTxClick}
              onContextMenu={onContextMenu}
              onDoubleClick={onDoubleClick}
              onKeyPress={() => {}}
            >
              <time title={tx.timestamp}>{timeFormatter(tx.timestamp)}</time>
              <span className={styles.amount} title={`${tx.value} shannons`}>
                {`${shannonToCKBFormatter(tx.value, true)} CKB`}
              </span>
              <span className={styles.status} title={statusLabel}>
                {statusLabel}
              </span>
              {confirmations >= 0 && (status === 'success' || status === 'confirming') ? (
                <span className={styles.confirmations} title={confirmationsLabel}>
                  {confirmationsLabel}
                </span>
              ) : null}
            </div>
            <div className={styles.detail}>
              <div title={typeLabel}>
                <span>{t('history.type')}</span>
                <span className={styles.type}>{typeLabel}</span>
              </div>
              <div title={tx.hash} className={styles.txHash}>
                <span>{t('history.transaction-hash')}</span>
                <div>
                  <span className={styles.hashOverflow}>{tx.hash.slice(0, -6)}</span>
                  <span className={styles.ellipsis}>...</span>
                  <span>{tx.hash.slice(-6)}</span>
                </div>
              </div>
              <div title={tx.description} className={styles.description}>
                <span>{t('history.description')}</span>
                <span>
                  <TextField
                    field="description"
                    data-description-key={tx.hash}
                    data-description-value={tx.description}
                    title={tx.description}
                    value={isSelected ? localDescription.description : tx.description || ''}
                    onBlur={isSelected ? onDescriptionFieldBlur : undefined}
                    onKeyPress={isSelected ? onDescriptionPress : undefined}
                    onChange={isSelected ? onDescriptionChange : undefined}
                    readOnly={!isSelected}
                    onClick={onDescriptionSelected}
                    className={styles.descriptionField}
                    placeholder={t('common.click-to-edit')}
                  />
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

TransactionList.displayName = 'TransactionList'

export default TransactionList
