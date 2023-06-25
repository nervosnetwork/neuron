import React, { useCallback, useState } from 'react'
import { clipboard } from 'electron'
import { useTranslation } from 'react-i18next'
import { Icon } from 'office-ui-fabric-react'
import { ReactComponent as Detail } from 'widgets/Icons/Detail.svg'
import TextField from 'widgets/TextField'
import { ReactComponent as CKBAvatar } from 'widgets/Icons/Nervos.svg'
import { ReactComponent as Success } from 'widgets/Icons/Success.svg'
import { ReactComponent as Pending } from 'widgets/Icons/Pending.svg'
import { ReactComponent as Failure } from 'widgets/Icons/Failure.svg'
import CopyZone from 'widgets/CopyZone'
import SUDTAvatar from 'widgets/SUDTAvatar'

import {
  CONSTANTS,
  shannonToCKBFormatter,
  uniformTimeFormatter as timeFormatter,
  localNumberFormatter,
  sudtValueToAmount,
  sUDTAmountFormatter,
  getExplorerUrl,
  useLocalDescription,
  nftFormatter,
} from 'utils'
import { StateDispatch } from 'states'
import { showTransactionDetails, openContextMenu, openExternal } from 'services/remote'

import { getDisplayName, isTonkenInfoStandardUAN, UANTokenName } from 'components/UANDisplay'
import styles from './transactionList.module.scss'

const { CONFIRMATION_THRESHOLD, DEFAULT_SUDT_FIELDS } = CONSTANTS

interface TransactionListProps {
  walletName: string
  walletID: string
  items: State.Transaction[]
  bestKnownBlockNumber: number
  isMainnet: boolean
  dispatch: StateDispatch
}

const TransactionList = ({
  items: txs,
  bestKnownBlockNumber,
  walletID,
  walletName,
  isMainnet,
  dispatch,
}: TransactionListProps) => {
  const [txHash, setTxHash] = useState('')
  const [isDetailOpening, setIsDetailOpening] = useState(false)
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange, onDescriptionSelected } =
    useLocalDescription('transaction', walletID, dispatch)

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
          label: t('history.copy-tx-hash'),
          click: () => {
            clipboard.writeText(hash)
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
            openExternal(`${getExplorerUrl(isMainnet)}/transaction/${btn.dataset.hash}`)
            break
          }
          case 'detail': {
            setIsDetailOpening(true)
            showTransactionDetails(btn.dataset.hash).finally(() => setIsDetailOpening(false))
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

        const confirmations = 1 + bestKnownBlockNumber - +tx.blockNumber
        let status = tx.status as string
        if (status === 'success' && confirmations < CONFIRMATION_THRESHOLD) {
          status = 'confirming'
        }
        const statusLabel = t(`history.${status}`)
        const confirmationsLabel = confirmations > 1000 ? '1,000+' : localNumberFormatter(confirmations)

        let name = '--'
        let amount = '--'
        let typeLabel = '--'
        let sudtAmount = ''
        let showWithUANFormatter = false

        if (tx.nftInfo) {
          // NFT
          name = walletName
          const { type, data } = tx.nftInfo
          typeLabel = `${t(`history.${type}`)} m-NFT`
          amount = `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}`
        } else if (tx.sudtInfo?.sUDT) {
          // Asset Account
          name = tx.sudtInfo.sUDT.tokenName || DEFAULT_SUDT_FIELDS.tokenName
          if (['create', 'destroy'].includes(tx.type)) {
            // create/destroy an account
            showWithUANFormatter = isTonkenInfoStandardUAN(tx.sudtInfo.sUDT.tokenName, tx.sudtInfo.sUDT.symbol)
            typeLabel = `${t(`history.${tx.type}`, { name: getDisplayName(name, tx.sudtInfo.sUDT.symbol) })}`
          } else {
            // send/receive to/from an account
            const type = +tx.sudtInfo.amount <= 0 ? 'send' : 'receive'
            typeLabel = `UDT ${t(`history.${type}`)}`
          }

          if (tx.sudtInfo.sUDT.decimal) {
            sudtAmount = sudtValueToAmount(tx.sudtInfo.amount, tx.sudtInfo.sUDT.decimal, true)
            amount = `${sUDTAmountFormatter(sudtAmount)} ${tx.sudtInfo.sUDT.symbol}`
          }
        } else {
          // normal tx
          name = walletName
          amount = `${shannonToCKBFormatter(tx.value, true)} CKB`
          if (tx.type === 'create' || tx.type === 'destroy') {
            if (tx.assetAccountType === 'CKB') {
              typeLabel = `${t(`history.${tx.type}`, { name: 'CKB' })}`
            } else {
              typeLabel = `${t(`overview.${tx.type}`, { name: 'Unknown' })}`
            }
          } else {
            typeLabel = tx.nervosDao ? 'Nervos DAO' : t(`history.${tx.type}`)
          }
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
                {tx.sudtInfo?.sUDT ? (
                  <SUDTAvatar name={name} type="token" style={{ width: '30px', height: '30px' }} />
                ) : (
                  <CKBAvatar />
                )}
              </div>
              <time title={tx.timestamp}>{timeFormatter(tx.timestamp)}</time>
              <CopyZone className={styles.amount} content={(sudtAmount || amount).replace(/[^\d\\.+-]/g, '')}>
                {amount}
              </CopyZone>
              <span className={styles.type} title={typeLabel}>
                {typeLabel}
              </span>
              {showWithUANFormatter ? (
                <UANTokenName name={name} symbol={tx.sudtInfo!.sUDT.symbol} className={styles.walletName} />
              ) : (
                <div className={`${styles.walletName} ${styles.tooltip}`} data-tooltip={name}>
                  <span>{name}</span>
                </div>
              )}
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
                <CopyZone content={tx.hash} name={t('history.copy-tx-hash')}>
                  <span className={styles.hashOverflow}>{tx.hash.slice(0, -6)}</span>
                  <span className={styles.ellipsis}>...</span>
                  <span>{tx.hash.slice(-6)}</span>
                </CopyZone>
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
                  disabled={isDetailOpening}
                >
                  <Detail />
                  <span>{isDetailOpening ? t('history.opening') : t('history.view-detail')}</span>
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
