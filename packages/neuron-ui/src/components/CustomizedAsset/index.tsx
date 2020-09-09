import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import { ReactComponent as UnknownTypeIcon } from 'widgets/Icons/CustomizedAssetUnknown.svg'
import { ReactComponent as LockedTypeIcon } from 'widgets/Icons/CustomizedAssetLocked.svg'
import { ReactComponent as VaultTypeIcon } from 'widgets/Icons/CustomizedAssetVault.svg'
import { openExternal } from 'services/remote'
import { uniformTimeFormatter, localNumberFormatter, getExplorerUrl } from 'utils'
import styles from './customizedAsset.module.scss'

export type CustomizedAssetType = 'ckb' | 'unknown' | 'sudt'

export interface CustomizedAssetProps {
  type: CustomizedAssetType
  tokenId: string
  tokenName: string
  createdDate: string
  assetAmount: string
  symbol: string
  outPoint: CKBComponents.OutPoint
  isMainnet: boolean
  isOnline: boolean
}

const I18N_PATH = `customized-asset`

const AssetTypeIcon = ({ type }: { type: CustomizedAssetType }) => {
  switch (type) {
    case 'ckb': {
      return <LockedTypeIcon />
    }
    case 'sudt': {
      return <VaultTypeIcon />
    }
    default: {
      return <UnknownTypeIcon />
    }
  }
}

const Actions = ({
  type,
  disabled,
  onClick,
}: {
  type: CustomizedAssetType
  disabled: boolean
  onClick: React.EventHandler<React.MouseEvent>
}) => {
  const [t] = useTranslation()
  switch (type) {
    case 'ckb': {
      return (
        <Button
          type="primary"
          disabled={disabled}
          data-action="unlock"
          onClick={onClick}
          label={t(`${I18N_PATH}.actions.unlock`)}
        />
      )
    }
    case 'sudt': {
      return (
        <>
          <Button
            type="primary"
            disabled={disabled}
            data-action="mint"
            onClick={onClick}
            label={t(`${I18N_PATH}.actions.mint`)}
          />
          <Button
            type="primary"
            disabled={disabled}
            data-action="burn"
            onClick={onClick}
            label={t(`${I18N_PATH}.actions.burn`)}
          />
        </>
      )
    }
    default: {
      return <Button type="primary" disabled onClick={onClick} label={t(`${I18N_PATH}.actions.unknown`)} />
    }
  }
}

const CustomizedAsset = ({
  type,
  tokenId,
  tokenName,
  createdDate,
  assetAmount,
  symbol,
  outPoint,
  isOnline,
  isMainnet,
}: CustomizedAssetProps) => {
  const [t] = useTranslation()
  const time = uniformTimeFormatter(createdDate).substr(0, 10)
  const disabled = !isOnline

  const handleOpenExplorer = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${outPoint.txHash}#${+outPoint.index}`)
  }, [outPoint, isMainnet])

  const handleSetupInfoClick = useCallback(() => {
    console.info(`Setup token info of ${tokenId}`)
  }, [tokenId])

  const handleActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return
      }
      const {
        dataset: { action },
      } = e.currentTarget
      switch (action) {
        case 'unlock': {
          console.info(`unlock outPoint ${JSON.stringify(outPoint)}`)
          break
        }
        case 'mint': {
          console.info(`mint token id ${tokenId}`)
          break
        }
        case 'burn': {
          console.info(`burn token id ${tokenId}`)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [tokenId, outPoint, disabled]
  )

  return (
    <div className={styles.container}>
      <div className={styles.tokenName}>
        <span>{tokenName || 'Unknown'}</span>
        {type !== 'unknown' ? (
          <span>{`(${symbol})`}</span>
        ) : (
          <button type="button" className={styles.setup} onClick={handleSetupInfoClick}>
            {t(`${I18N_PATH}.setupInfo`)}
          </button>
        )}
      </div>
      <div className={styles.type}>
        <AssetTypeIcon type={type} />
      </div>
      <time dateTime={createdDate}>{time}</time>
      <div className={styles.amount}>{localNumberFormatter(assetAmount)}</div>
      <div className={styles.actions} data-token-id={tokenId}>
        <Actions type={type} disabled={disabled} onClick={handleActionClick} />
      </div>
      <div className={styles.explorer}>
        <button
          type="button"
          className={styles.explorerNavButton}
          title={t(`${I18N_PATH}.view-in-explorer`)}
          onClick={handleOpenExplorer}
        >
          <Icon iconName="Explorer" />
        </button>
      </div>
    </div>
  )
}

CustomizedAsset.displayName = 'CustomizedAsset'

export default CustomizedAsset
