import React, { useCallback } from 'react'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import { uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import getExplorerUrl from 'utils/getExplorerUrl'
import { openExternal } from 'services/remote'
import styles from './specialAsset.module.scss'

export interface SpecialAssetProps {
  datetime: number
  capacity: string
  hasTypeScript: boolean
  hasData: boolean
  actionLabel: 'Locked Asset'
  isMainnet: boolean
  txHash: string
}

const SpecialAsset = ({
  datetime,
  capacity,
  hasTypeScript,
  hasData,
  actionLabel,
  isMainnet,
  txHash,
}: SpecialAssetProps) => {
  const [date, time] = uniformTimeFormatter(datetime).split(' ')

  const onViewDetail = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${txHash}`)
  }, [isMainnet, txHash])

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
        <div data-on={hasTypeScript} data-tooltip="Special Type">
          T
        </div>
        <div data-on={hasData} data-tooltip="Special Data">
          D
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          type="primary"
          label={actionLabel}
          onClick={() => {
            console.info()
          }}
        />
        <Button type="default" label="View Detail" className={styles.detailBtn} onClick={onViewDetail} />
      </div>
    </div>
  )
}

SpecialAsset.displayName = 'SpecialAsset'
export default SpecialAsset
