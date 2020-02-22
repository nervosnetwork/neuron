import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import { uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import getExplorerUrl from 'utils/getExplorerUrl'
import { unlockSpecialAsset, openExternal } from 'services/remote'
import styles from './specialAsset.module.scss'

export interface SpecialAssetProps {
  datetime: number
  capacity: string
  hasTypeScript: boolean
  hasData: boolean
  status: 'user-defined-asset' | 'locked-asset' | 'claim-asset'
  isMainnet: boolean
  txHash: string
}

const SpecialAsset = ({ datetime, capacity, hasTypeScript, hasData, status, isMainnet, txHash }: SpecialAssetProps) => {
  const [t] = useTranslation()
  const [date, time] = uniformTimeFormatter(datetime).split(' ')

  const onViewDetail = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${txHash}`)
  }, [isMainnet, txHash])

  const onAction = useCallback(() => {
    if (status === 'claim-asset') {
      unlockSpecialAsset({
        walletID: '',
        outPoint: { txHash: '', index: '' },
        fee: '',
        feeRate: '',
        customizedAssetInfo: {
          lock: '',
          type: '',
          data: '',
        },
      })
    }
  }, [status])

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
          type="primary"
          label={t(`special-assets.${status}`)}
          onClick={onAction}
          disabled={['user-defined-asset', 'locked-asset'].includes(status)}
          data-tooltip={t(`special-assets.${status}-tooltip`)}
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
