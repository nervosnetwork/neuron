import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from 'office-ui-fabric-react'
import { ReactComponent as Detail } from 'widgets/Icons/Detail.svg'
import TextField from 'widgets/TextField'
import CKBAvatar from 'widgets/Icons/CKBAvatar.png'
import { ReactComponent as Success } from 'widgets/Icons/Success.svg'
import { ReactComponent as Pending } from 'widgets/Icons/Pending.svg'
import { ReactComponent as Failure } from 'widgets/Icons/Failure.svg'

import { StateDispatch } from 'states/stateProvider/reducer'
import { showTransactionDetails, openContextMenu, openExternal } from 'services/remote'

import { useLocalDescription } from 'utils/hooks'
import {
  shannonToCKBFormatter,
  uniformTimeFormatter as timeFormatter,
  localNumberFormatter,
  sudtValueToAmount,
} from 'utils/formatters'
import getExplorerUrl from 'utils/getExplorerUrl'
import { CONFIRMATION_THRESHOLD, DEFAULT_SUDT_FIELDS } from 'utils/const'
import styles from './transactionList.module.scss'

const TransactionList = ({
  items: txs,
  tipBlockNumber,
  walletName,
  walletID,
  isMainnet,
  dispatch,
}: {
  isLoading?: boolean
  walletName: string
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

  const onActionBtnClick = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const btn = (e.target as HTMLButtonElement)?.closest('button')
      if (btn?.dataset?.hash && btn?.dataset?.action) {
        switch (btn.dataset.action) {
          case 'explorer': {
            const explorerUrl = isMainnet ? 'https://explorer.nervos.org' : 'https://explorer.nervos.org/aggron'
            openExternal(`${explorerUrl}/transaction/${btn.dataset.hash}`)
            break
          }
          case 'detail': {
            showTransactionDetails(btn.dataset.hash)
            break
          }
          default: {
            // ignore
          }
        }
      }
    },
    [isMainnet]
  )

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
        const confirmationsLabel = confirmations > 1000 ? '1,000+' : localNumberFormatter(confirmations)

        let name = '--'
        let value = '--'
        let amount = '--'
        let typeLabel = '--'

        if (tx.sudtInfo?.sUDT) {
          name = tx.sudtInfo.sUDT.tokenName || DEFAULT_SUDT_FIELDS.tokenName
          const type = +tx.sudtInfo.amount <= 0 ? 'send' : 'receive'
          typeLabel = `UDT ${t(`history.${type}`)}`
          value = tx.sudtInfo.amount

          if (tx.sudtInfo.sUDT.decimal) {
            amount = `${sudtValueToAmount(value, tx.sudtInfo.sUDT.decimal)} ${tx.sudtInfo.sUDT.symbol}`
          }
        } else {
          name = walletName
          value = `${tx.value} shannons`
          amount = `${shannonToCKBFormatter(tx.value, true)} CKB`
          typeLabel = tx.nervosDao ? 'Nervos DAO' : t(`history.${tx.type}`)
        }

        let indicator = <Pending />
        switch (status) {
          case 'success': {
            indicator = <Success />
            break
          }
          case 'failed': {
            indicator = <Failure />
            break
          }
          default: {
            // ignore
          }
        }
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
              onKeyPress={() => {}}
            >
              <div className={styles.avatar}>
                <img src={CKBAvatar} alt="avatar" />
              </div>
              <time title={tx.timestamp}>{timeFormatter(tx.timestamp)}</time>
              <div className={styles.amount} title={value}>
                {amount}
              </div>
              <span className={styles.type} title={typeLabel}>
                {typeLabel}
              </span>
              <span className={styles.walletName}>{name}</span>
              <div className={styles.indicator}>{indicator}</div>
            </div>
            <div className={styles.detail}>
              <div title={statusLabel}>
                <span>{t('history.status')}</span>
                <span>{statusLabel}</span>
              </div>
              <div>
                <span>{t('history.confirmations')}</span>
                {confirmations >= 0 && (status === 'success' || status === 'confirming') ? (
                  <span className={styles.confirmations} title={confirmationsLabel}>
                    {confirmationsLabel}
                  </span>
                ) : null}
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
              </div>
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.detailNavButton}
                  title={t('history.view-detail-button-title')}
                  onClick={onActionBtnClick}
                  data-hash={tx.hash}
                  data-action="detail"
                >
                  <Detail />
                  <span>{t('history.view-detail')}</span>
                </button>
                <button
                  type="button"
                  className={styles.explorerNavButton}
                  title={t('history.view-in-explorer-button-title')}
                  onClick={onActionBtnClick}
                  data-hash={tx.hash}
                  data-action="explorer"
                >
                  <Icon iconName="Explorer" />
                  <span>{t('history.view-in-explorer')}</span>
                </button>
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
