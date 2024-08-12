import type { TOptions } from 'i18next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountType, isAnyoneCanPayAddress, isSecp256k1Address, isSuccessResponse, shannonToCKBFormatter } from 'utils'
import { SUDTAccount } from 'components/SUDTAccountList'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import { generateChequeTransaction, generateSUDTTransaction, getHoldSUDTCellCapacity } from 'services/remote'
import { AppActions, useDispatch } from 'states'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { SendType, UDTType } from 'utils/enums'

export enum AddressLockType {
  secp256 = 'secp256',
  acp = 'acp',
  unknow = 'unknow',
}

export function useAddressLockType(address: string, isMainnet: boolean) {
  return useMemo(() => {
    if (isSecp256k1Address(address)) {
      return AddressLockType.secp256
    }
    if (isAnyoneCanPayAddress(address, isMainnet)) {
      return AddressLockType.acp
    }
    return AddressLockType.unknow
  }, [address])
}

type Option = {
  tooltip?: string
  label: string
  key: SendType
  params?: TOptions
}
export function useOptions({
  address,
  addressLockType,
  accountInfo,
  isAddressCorrect,
  udtType,
}: {
  address: string
  addressLockType: AddressLockType
  accountInfo: SUDTAccount | null
  isAddressCorrect: boolean
  udtType?: UDTType
}) {
  const [holdSUDTCellCapacity, setHoldSUDTCellCapacity] = useState<string | undefined | null>()
  useEffect(() => {
    if (
      accountInfo?.tokenId &&
      accountInfo?.tokenId !== DEFAULT_SUDT_FIELDS.CKBTokenId &&
      isAddressCorrect &&
      address
    ) {
      getHoldSUDTCellCapacity({
        address,
        tokenID: accountInfo.tokenId,
        udtType,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            setHoldSUDTCellCapacity(res.result)
          }
        })
        .catch(() => {
          setHoldSUDTCellCapacity(undefined)
        })
    } else {
      setHoldSUDTCellCapacity(undefined)
    }
  }, [accountInfo, address, isAddressCorrect])
  return useMemo<Option[] | undefined>(() => {
    if (accountInfo?.tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId) {
      return undefined
    }
    if (addressLockType === AddressLockType.secp256) {
      return [
        {
          label: 'cheque-address-hint.label',
          tooltip: 'cheque-address-hint.tooltip',
          key: SendType.secp256Cheque,
        },
        {
          label: 'extra-ckb-send-to-secp256.label',
          tooltip: 'extra-ckb-send-to-secp256.tooltip',
          key: SendType.secp256NewCell,
          params: { assetName: accountInfo?.accountName },
        },
      ]
    }
    if (holdSUDTCellCapacity) {
      return [
        {
          label:
            addressLockType === AddressLockType.acp ? 'extra-ckb-send-to-acp.label' : 'extra-ckb-send-to-unknow.label',
          key: addressLockType === AddressLockType.acp ? SendType.acpNewCell : SendType.unknowNewCell,
          params: { assetName: accountInfo?.accountName, extraCKB: shannonToCKBFormatter(holdSUDTCellCapacity) },
        },
      ]
    }
    return undefined
  }, [addressLockType, holdSUDTCellCapacity, accountInfo])
}

export function useSendType({
  addressLockType,
  accountType,
}: {
  addressLockType: AddressLockType
  accountType: AccountType
}) {
  const [sendType, setSendType] = useState<SendType | undefined>()
  useEffect(() => {
    if (accountType === AccountType.CKB) {
      setSendType(SendType.sendCKB)
      return
    }
    switch (addressLockType) {
      case AddressLockType.secp256:
        setSendType(SendType.secp256Cheque)
        break
      case AddressLockType.acp:
        setSendType(undefined)
        break
      case AddressLockType.unknow:
        setSendType(undefined)
        break
      default:
        break
    }
  }, [addressLockType, accountType])
  const onChange = useCallback(
    (id: SendType | undefined) => {
      setSendType(id)
    },
    [setSendType]
  )
  return {
    sendType,
    onChange,
  }
}

export const isSendType = (v: string): v is SendType => {
  return Object.values(SendType).includes(v as SendType)
}

export function getGenerator(sendType?: SendType) {
  if (sendType === SendType.secp256Cheque) {
    return generateChequeTransaction
  }
  return generateSUDTTransaction
}

export async function batchGenerateExperimental(experimental: State.Experimental, priceArray: string[]) {
  if (experimental?.params) {
    const { params } = experimental
    const generator = getGenerator(params.sendType)
    const requestArray = priceArray.map(itemPrice => generator({ ...params, feeRate: itemPrice }))
    const allPromiseResult = await Promise.allSettled(requestArray)
    const resList = allPromiseResult.map(
      (batchItem: PromiseSettledResult<ControllerResponse<{ fee: string }>>, index: number) => ({
        feeRateValue: priceArray[index],
        feeValue:
          batchItem.status === 'fulfilled' && isSuccessResponse(batchItem.value) && batchItem.value.result
            ? batchItem.value.result.fee
            : '0',
      })
    )
    return resList
  }
  return priceArray.map((_, index: number) => ({
    feeRateValue: priceArray[index],
    feeValue: '0',
  }))
}

export function useOnSubmit({
  isSubmittable,
  accountType,
  walletId,
  addressLockType,
  sendType,
}: {
  isSubmittable: boolean
  accountType: AccountType
  walletId: string
  addressLockType: AddressLockType
  sendType?: SendType
}) {
  const dispatch = useDispatch()
  return useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSubmittable) {
        let actionType: State.PasswordRequest['actionType'] = 'send-sudt'
        switch (sendType) {
          case SendType.sendCKB:
            actionType = addressLockType === AddressLockType.secp256 ? 'send-acp-ckb-to-new-cell' : 'send-ckb-asset'
            break
          case SendType.secp256Cheque:
            actionType = 'send-cheque'
            break
          case SendType.acpNewCell:
          case SendType.secp256NewCell:
          case SendType.unknowNewCell:
            actionType = 'send-acp-sudt-to-new-cell'
            break
          default:
            actionType = 'send-sudt'
        }
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId,
            actionType,
          },
        })
      }
    },
    [isSubmittable, dispatch, walletId, accountType, addressLockType, sendType]
  )
}
