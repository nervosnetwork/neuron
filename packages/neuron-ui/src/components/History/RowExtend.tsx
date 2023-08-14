import React, { useCallback } from 'react'
import { showPageNotice, useDispatch } from 'states'
import { openExternal } from 'services/remote'

import { clsx, getExplorerUrl, localNumberFormatter, RoutePath, useLocalDescription } from 'utils'
import { TableProps } from 'widgets/Table'
import { useNavigate } from 'react-router-dom'
import { ExplorerIcon, Copy, DetailIcon } from 'widgets/Icons/icon'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'

import Tooltip from 'widgets/Tooltip'
import { useTranslation } from 'react-i18next'
import styles from './history.module.scss'

type RowExtendProps = {
  column: State.Transaction
  columns: TableProps<State.Transaction>['columns']
  isMainnet: boolean
  bestBlockNumber: number
  id: string
}

const RowExtend = ({ column, columns, isMainnet, id, bestBlockNumber }: RowExtendProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionChange, onDescriptionFieldBlur, onDescriptionSelected } =
    useLocalDescription('transaction', id, dispatch, 'textarea')

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
          default: {
            // ignore
          }
        }
      }
    },
    [isMainnet]
  )

  const { blockNumber, hash, description } = column
  const confirmations = 1 + bestBlockNumber - +blockNumber
  const confirmationsLabel = confirmations > 1000 ? '1,000+' : localNumberFormatter(confirmations)
  const isSelected = localDescription.key === column.hash
  const onCopy = useCallback(() => {
    window.navigator.clipboard.writeText(hash)
    showPageNotice('common.copied')(dispatch)
  }, [hash, dispatch])

  return (
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
                  <div className={styles.descTipRoot}>
                    <div className={styles.autoHeight}>
                      <textarea
                        className={styles.descInput}
                        data-is-selected={isSelected}
                        data-description-key={column.hash}
                        value={isSelected ? localDescription.description : description}
                        onChange={onDescriptionChange}
                        onKeyDown={onDescriptionPress}
                        onBlur={onDescriptionFieldBlur}
                      />
                      <Edit
                        data-description-key={column.hash}
                        data-description-value={column.description}
                        onClick={onDescriptionSelected}
                      />
                    </div>
                    <div className={styles.hidden}>
                      {isSelected ? localDescription.description : description}
                      <Edit />
                    </div>
                  </div>
                }
                showTriangle
                isTriggerNextToChild
                className={styles.description}
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
            <button
              type="button"
              className={styles.explorerNavButton}
              title={t('history.view-in-explorer-button-title')}
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
              title={t('history.view-detail-button-title')}
              onClick={onActionBtnClick}
              data-hash={hash}
              data-action="detail"
            >
              <DetailIcon />
              <span>{t('history.view-detail')}</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}
export default RowExtend
