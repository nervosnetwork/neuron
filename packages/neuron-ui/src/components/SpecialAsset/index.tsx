import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import { openExternal } from 'services/remote'
import { uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import getExplorerUrl from 'utils/getExplorerUrl'
import { ConnectionStatus } from 'utils/const'
import styles from './specialAsset.module.scss'

const MS_PER_EPOCHS = 4 * 60 * 60 * 1000

export interface SpecialAssetProps {
  datetime: number
  capacity: string
  hasTypeScript: boolean
  hasData: boolean
  status: 'user-defined-asset' | 'locked-asset' | 'claim-asset'
  isMainnet: boolean
  outPoint: {
    txHash: string
    index: string
  }
  epochsInfo?: {
    target: number
    current: number
  }
  onAction: any
  connectionStatus: State.ConnectionStatus
}

const SpecialAsset = ({
  datetime,
  capacity,
  hasTypeScript,
  hasData,
  status,
  isMainnet,
  outPoint: { txHash, index },
  epochsInfo,
  onAction,
  connectionStatus,
}: SpecialAssetProps) => {
  const [t] = useTranslation()
  const [date, time] = uniformTimeFormatter(datetime).split(' ')
  let targetTime: undefined | number
  if (epochsInfo?.target !== undefined && epochsInfo?.current !== undefined) {
    targetTime = Date.now() + (epochsInfo.target - epochsInfo.current) * MS_PER_EPOCHS
  }

  const onViewDetail = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${txHash}/${index}`)
  }, [isMainnet, txHash, index])

  return (
    <div className={styles.container}>
      <div className={styles.datetime}>
        <span>{date}</span>
        <span>{time}</span>
      </div>
      <div className={styles.capacity}>
        <Balance balance={shannonToCKBFormatter(capacity)} />
      </div>
      <div className={styles.indicators}>
        <div data-on={hasTypeScript} data-tooltip="Type">
          T
        </div>
        <div data-on={hasData} data-tooltip="Data">
          D
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          data-tx-hash={txHash}
          data-idx={index}
          type="primary"
          label={t(`special-assets.${status}`)}
          onClick={onAction}
          disabled={
            ['user-defined-asset', 'locked-asset'].includes(status) || connectionStatus === ConnectionStatus.Offline
          }
          className={['user-defined-asset', 'locked-asset'].includes(status) ? styles.hasTooltip : ''}
          data-tooltip={t(`special-assets.${status}-tooltip`, {
            epochs: epochsInfo?.target.toFixed(2),
            year: targetTime ? new Date(targetTime).getFullYear() : '',
            month: targetTime ? new Date(targetTime).getMonth() + 1 : '',
            day: targetTime ? new Date(targetTime).getDate() : '',
          })}
        />
        <Button
          type="default"
          label={t('special-assets.view-details')}
          className={styles.detailBtn}
          onClick={onViewDetail}
        />
      </div>
    </div>
  )
}

SpecialAsset.displayName = 'SpecialAsset'
export default SpecialAsset
