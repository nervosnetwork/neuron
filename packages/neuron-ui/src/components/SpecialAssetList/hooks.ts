import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ckbCore } from 'services/chain'
import { getSUDTAccountList } from 'services/remote'
import { NeuronWalletActions, useDispatch } from 'states'
import {
  epochParser,
  getSUDTAmount,
  isSuccessResponse,
  nftFormatter,
  PresetScript,
  shannonToCKBFormatter,
  sudtValueToAmount,
  toUint128Le,
  useDialogWrapper,
  useDidMount,
} from 'utils'
import { MILLISECONDS } from 'utils/const'
import { AssetInfo, ChequeAssetInfo, NFTType } from '.'

export const useMigrate = () => {
  const { openDialog, dialogRef, closeDialog } = useDialogWrapper()
  const onDocumentClick = useCallback(
    (e: any) => {
      if (!dialogRef?.current?.children?.[0]?.contains(e.target) && dialogRef?.current?.open) {
        closeDialog()
      }
    },
    [closeDialog, dialogRef]
  )
  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })
  return {
    openDialog,
    dialogRef,
    closeDialog,
  }
}

export const useClickMigrate = ({
  closeMigrateDialog,
  openMigrateToNewAccountDialog,
  openMigrateToExistAccountDialog,
}: {
  closeMigrateDialog: () => void
  openMigrateToNewAccountDialog: () => void
  openMigrateToExistAccountDialog: () => void
}) => {
  return useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { type },
      } = e.currentTarget
      closeMigrateDialog()
      switch (type) {
        case 'new-account':
          openMigrateToNewAccountDialog()
          break
        case 'exist-account':
          openMigrateToExistAccountDialog()
          break
        default:
          break
      }
    },
    [closeMigrateDialog, openMigrateToNewAccountDialog, openMigrateToExistAccountDialog]
  )
}

export const useGetAssetAccounts = (walletID: string) => {
  const dispatch = useDispatch()
  useEffect(() => {
    getSUDTAccountList({ walletID })
      .then(res => {
        if (isSuccessResponse(res)) {
          return res.result
        }
        throw new Error(res.message.toString())
      })
      .then((list: Controller.GetSUDTAccountList.Response) => {
        dispatch({
          type: NeuronWalletActions.GetSUDTAccountList,
          payload: list,
        })
      })
      .catch((err: Error) => console.error(err))
  }, [walletID, dispatch])
}

interface SpecialAssetColumnInfoProps {
  cell: CKBComponents.CellOutput & {
    data: string
  }
  datetime: number
  epoch: string
  assetInfo: AssetInfo
  bestKnownBlockTimestamp: number
  tokenInfoList: Array<Controller.GetTokenInfoList.TokenInfo>
}

export const useGetSpecialAssetColumnInfo = ({
  cell: { capacity, lock, type, data },
  datetime,
  epoch,
  assetInfo,
  bestKnownBlockTimestamp,
  tokenInfoList,
}: SpecialAssetColumnInfoProps) => {
  const [t] = useTranslation()

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
      targetTime = bestKnownBlockTimestamp + (epochsInfo.target - epochsInfo.current) * MILLISECONDS
      if (epochsInfo.target > epochsInfo.current) {
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
      } catch {
        amount = 'sUDT Token'
      }
      break
    }
    case PresetScript.SUDT: {
      status = 'user-defined-token'
      const tokenInfo = tokenInfoList.find(info => info.tokenID === type?.args)
      const amountInfo = getSUDTAmount({ tokenInfo, data })
      amount = amountInfo.amount
      break
    }
    default: {
      // ignore
    }
  }

  const isLockedCheque = status === 'withdraw-asset' && Date.now() < targetTime!
  const isNFTTransferable = assetInfo.type === NFTType.NFT && assetInfo.data === 'transferable'
  const isNFTClassOrIssuer = assetInfo.type === NFTType.NFTClass || assetInfo.type === NFTType.NFTIssuer

  if (assetInfo.type === NFTType.NFT) {
    amount = nftFormatter(type?.args)
    status = 'transfer-nft'
  } else if (isNFTClassOrIssuer || assetInfo.type === 'Unknown') {
    amount = t('special-assets.unknown-asset')
  }

  return { amount, status, targetTime, isLockedCheque, isNFTTransferable, isNFTClassOrIssuer, epochsInfo }
}
