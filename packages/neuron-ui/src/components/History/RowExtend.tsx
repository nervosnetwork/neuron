import React, { useCallback, useEffect, useState } from 'react'
import { showPageNotice, useDispatch } from 'states'
import { openExternal } from 'services/remote'

import { clsx, getExplorerUrl, localNumberFormatter, RoutePath, useLocalDescription } from 'utils'
import { TableProps } from 'widgets/Table'
import { useNavigate } from 'react-router-dom'
import { ExplorerIcon, Copy, DetailIcon } from 'widgets/Icons/icon'
import { useTranslation } from 'react-i18next'
import ShowOrEditDesc from 'widgets/ShowOrEditDesc'
import Tooltip from 'widgets/Tooltip'
import AmendPendingTransactionDialog from 'components/AmendPendingTransactionDialog'
import { getTransaction as getOnChainTransaction } from 'services/chain'

import Button from 'widgets/Button'
import styles from './history.module.scss'

type RowExtendProps = {
  column: State.Transaction
  columns: TableProps<State.Transaction>['columns']
  isMainnet: boolean
  bestBlockNumber: number
  id: string
  isWatchOnly?: boolean
}

const RowExtend = ({ column, columns, isMainnet, id, bestBlockNumber, isWatchOnly }: RowExtendProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [t] = useTranslation()
  const [amendabled, setAmendabled] = useState(false)
  const [amendPendingTx, setAmendPendingTx] = useState<State.Transaction>()

  const { onChangeEditStatus, onSubmitDescription } = useLocalDescription('transaction', id, dispatch)

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
            navigate(`${RoutePath.History}/${btn.dataset.hash}`)
            break
          }
          case 'amend': {
            if (column.type === 'send' && !column.nftInfo && !column.nervosDao) {
              if (column?.sudtInfo) {
                navigate(`${RoutePath.History}/amendSUDTSend/${btn.dataset.hash}`)
              } else {
                navigate(`${RoutePath.History}/amend/${btn.dataset.hash}`)
              }
            } else {
              setAmendPendingTx(column)
            }

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

  const { blockNumber, hash, description, status } = column
  const confirmations = bestBlockNumber && blockNumber ? 1 + bestBlockNumber - +blockNumber : null
  const confirmationsLabel =
    // eslint-disable-next-line no-nested-ternary
    confirmations === null || confirmations < 0
      ? '--'
      : confirmations > 1000
      ? '1,000+'
      : localNumberFormatter(confirmations)
  const onCopy = useCallback(() => {
    window.navigator.clipboard.writeText(hash)
    showPageNotice('common.copied')(dispatch)
  }, [hash, dispatch])

  useEffect(() => {
    setAmendabled(false)
    if (status !== 'success' && column.type !== 'receive' && !isWatchOnly) {
      getOnChainTransaction(hash).then(tx => {
        const { minReplaceFee } = tx
        if (minReplaceFee) {
          setAmendabled(true)
        }
      })
    }
  }, [status, hash, setAmendabled])

  const onCloseAmendDialog = useCallback(() => {
    setAmendPendingTx(undefined)
  }, [setAmendPendingTx])

  return (
    <>
      <tr>
        <td colSpan={columns.length} className={styles.extendWrapper} style={{ paddingLeft: `${columns?.[0]?.width}` }}>
          <div className={styles.extendBox} style={{ gridColumn: `${2 / columns.length}` }}>
            <div className={styles.infoBox}>
              <div className={clsx(styles.infoBlock, styles.confirmCount)}>
                <div className={styles.infoBlockTitle}>{t('history.confirmationTimes')}</div>
                <div>{confirmationsLabel}</div>
              </div>
              <div className={styles.infoBlock}>
                <div className={styles.infoBlockTitle}>{t('history.description')}</div>
                <Tooltip
                  tip={
                    <ShowOrEditDesc
                      onChangeEditStatus={onChangeEditStatus}
                      onSubmitDescription={onSubmitDescription}
                      description={description}
                      descKey={column.hash}
                    />
                  }
                  showTriangle
                  isTriggerNextToChild
                >
                  <div className={styles.descText}>{description || t('addresses.default-description')}</div>
                </Tooltip>
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.infoBlockTitle}>{t('history.transaction-hash')}</div>
              <div className={styles.txHash}>
                {hash}
                <Copy onClick={onCopy} />
              </div>
            </div>
            <div className={styles.infoOperationBox}>
              <div>
                <button
                  type="button"
                  className={styles.explorerNavButton}
                  onClick={onActionBtnClick}
                  data-hash={hash}
                  data-action="explorer"
                >
                  <ExplorerIcon />
                  <span>{t('history.view-in-explorer')}</span>
                </button>
                <button
                  type="button"
                  className={styles.detailNavButton}
                  onClick={onActionBtnClick}
                  data-hash={hash}
                  data-action="detail"
                >
                  <DetailIcon />
                  <span>{t('history.view-detail')}</span>
                </button>
              </div>

              {amendabled ? (
                <Button
                  type="reset"
                  className={styles.amendButton}
                  onClick={onActionBtnClick}
                  data-hash={hash}
                  data-action="amend"
                >
                  <span>{t('history.amend')}</span>
                </Button>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
      {amendPendingTx ? <AmendPendingTransactionDialog tx={amendPendingTx} onClose={onCloseAmendDialog} /> : null}
    </>
  )
}
export default RowExtend
