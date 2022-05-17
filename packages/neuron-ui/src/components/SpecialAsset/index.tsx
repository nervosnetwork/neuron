import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import { openExternal } from 'services/remote'
import { ckbCore } from 'services/chain'
import {
  ConnectionStatus,
  uniformTimeFormatter,
  shannonToCKBFormatter,
  getExplorerUrl,
  PresetScript,
  epochParser,
  toUint128Le,
  sudtValueToAmount,
  nftFormatter,
  getSUDTAmount,
} from 'utils'
import styles from './specialAsset.module.scss'

const MS_PER_EPOCHS = 4 * 60 * 60 * 1000

interface LocktimeAssetInfo {
  data: string
  lock: PresetScript.Locktime
  type: string
}

interface ChequeAssetInfo {
  data: 'claimable' | 'withdraw-able'
  lock: PresetScript.Cheque
  type: ''
}

enum NFTType {
  NFT = 'NFT',
  NFTClass = 'NFTClass',
  NFTIssuer = 'NFTIssuer',
}

interface NFTAssetInfo {
  data: '' | 'transferable'
  lock: ''
  type: NFTType
}

type UnknownAssetInfo = Record<'data' | 'lock' | 'type', string>

export type AssetInfo = LocktimeAssetInfo | ChequeAssetInfo | UnknownAssetInfo | NFTAssetInfo

export interface SpecialAssetProps {
  cell: CKBComponents.CellOutput & {
    outPoint: CKBComponents.OutPoint
    data: string
  }
  datetime: number
  isMainnet: boolean
  epoch: string
  assetInfo: AssetInfo
  onAction: any
  connectionStatus: State.ConnectionStatus
  bestKnownBlockTimestamp: number
  tokenInfoList: Array<Controller.GetTokenInfoList.TokenInfo>
}

const SpecialAsset = ({
  cell: {
    outPoint: { txHash, index },
    capacity,
    lock,
    type,
    data,
  },
  datetime,
  isMainnet,
  epoch,
  assetInfo,
  onAction,
  connectionStatus,
  bestKnownBlockTimestamp,
  tokenInfoList,
}: SpecialAssetProps) => {
  const [t] = useTranslation()
  const [date, time] = uniformTimeFormatter(datetime).split(' ')
  let targetTime: undefined | number
  let status:
    | 'user-defined-asset'
    | 'locked-asset'
    | 'claim-asset'
    | 'withdraw-asset'
    | 'transfer-nft'
    | 'user-defined-token' = 'user-defined-asset'
  let epochsInfo: Record<'target' | 'current', number> | undefined
  let amount: string = `${shannonToCKBFormatter(capacity)} CKB`
  let amountToCopy: string = shannonToCKBFormatter(capacity, false, '')

  switch (assetInfo.lock) {
    case PresetScript.Locktime: {
      const targetEpochInfo = epochParser(ckbCore.utils.toUint64Le(`0x${lock.args.slice(-16)}`))
      const currentEpochInfo = epochParser(epoch)
      const targetEpochFraction =
        Number(targetEpochInfo.length) > 0 ? Number(targetEpochInfo.index) / Number(targetEpochInfo.length) : 1
      epochsInfo = {
        target: Number(targetEpochInfo.number) + Math.min(targetEpochFraction, 1),
        current: Number(currentEpochInfo.number) + Number(currentEpochInfo.index) / Number(currentEpochInfo.length),
      }
      targetTime = bestKnownBlockTimestamp + (epochsInfo.target - epochsInfo.current) * MS_PER_EPOCHS
      if (epochsInfo.target - epochsInfo.current > 0) {
        status = 'locked-asset'
      } else {
        status = 'claim-asset'
      }
      break
    }
    case PresetScript.Cheque: {
      status = (assetInfo as ChequeAssetInfo).data === 'claimable' ? 'claim-asset' : 'withdraw-asset'

      if (status === 'withdraw-asset') {
        const DAY = 86_400_000
        targetTime = datetime + DAY
      }

      try {
        const tokenInfo = tokenInfoList.find(info => info.tokenID === type?.args)
        if (!tokenInfo) {
          throw new Error('Token info not found')
        }
        const balance = BigInt(toUint128Le(data)).toString()
        amount = `${sudtValueToAmount(balance, tokenInfo.decimal)} ${tokenInfo.symbol}`
        amountToCopy = sudtValueToAmount(balance, tokenInfo.decimal, false, '')
      } catch {
        amount = 'sUDT Token'
        amountToCopy = 'sUDT Token'
      }
      break
    }
    case PresetScript.SUDT: {
      status = 'user-defined-token'
      const tokenInfo = tokenInfoList.find(info => info.tokenID === type?.args)
      const amountInfo = getSUDTAmount({ tokenInfo, data })
      amount = amountInfo.amount
      amountToCopy = amountInfo.amountToCopy
      break
    }
    default: {
      // ignore
    }
  }

  const onViewDetail = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${txHash}#${index}`)
  }, [isMainnet, txHash, index])

  const isLockedCheque = status === 'withdraw-asset' && Date.now() < targetTime!
  const isNFTTransferable = assetInfo.type === NFTType.NFT && assetInfo.data === 'transferable'
  const isNFTClassOrIssuer = assetInfo.type === NFTType.NFTClass || assetInfo.type === NFTType.NFTIssuer

  if (assetInfo.type === NFTType.NFT) {
    amount = nftFormatter(type?.args)
    status = 'transfer-nft'
  } else if (isNFTClassOrIssuer || assetInfo.type === 'Unknown') {
    amount = t('special-assets.unknown-asset')
  }

  return (
    <div className={styles.container}>
      <div className={styles.datetime}>
        <span>{date}</span>
        <span>{time}</span>
      </div>
      <CopyZone className={styles.capacity} content={assetInfo.type === NFTType.NFT ? amount : amountToCopy}>
        {amount}
      </CopyZone>
      <div className={styles.actions}>
        {isNFTClassOrIssuer || (assetInfo.type === NFTType.NFT && !isNFTTransferable) ? null : (
          <Button
            data-tx-hash={txHash}
            data-idx={index}
            type="primary"
            label={t(`special-assets.${status}`)}
            onClick={onAction}
            disabled={
              ['user-defined-asset', 'locked-asset'].includes(status) ||
              connectionStatus === ConnectionStatus.Offline ||
              isLockedCheque
            }
            className={
              ['user-defined-asset', 'locked-asset', 'user-defined-token'].includes(status) || isLockedCheque
                ? styles.hasTooltip
                : ''
            }
            data-tooltip={
              assetInfo.lock === PresetScript.Cheque && !isLockedCheque
                ? null
                : t(`special-assets.${status}-tooltip`, {
                    epochs: epochsInfo?.target.toFixed(2),
                    year: targetTime ? new Date(targetTime).getFullYear() : '',
                    month: targetTime ? new Date(targetTime).getMonth() + 1 : '',
                    day: targetTime ? new Date(targetTime).getDate() : '',
                    hour: targetTime ? new Date(targetTime).getHours() : '',
                    minute: targetTime ? new Date(targetTime).getMinutes() : '',
                  })
            }
          />
        )}
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
