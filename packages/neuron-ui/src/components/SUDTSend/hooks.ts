import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountType, isAnyoneCanPayAddress, isSecp256k1Address, isSuccessResponse, shannonToCKBFormatter } from 'utils'
import { SUDTAccount } from 'components/SUDTAccountList'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import { generateChequeTransaction, generateSUDTTransaction, getSUDTCellExtraCkb } from 'services/remote'
import { AppActions, useDispatch } from 'states'

export enum SendType {
  secp256Cheque = 'cheque',
  secp256NewCell = 'secp256NewCell',
  acpExistCell = 'acpExistCell',
  acpNewCell = 'acpNewCell',
  unknowNewCell = 'unknowNewCell',
  sendCKB = 'sendCKB',
}

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
  tValue: string
  key: SendType
  params?: object
}
export function useOptions({
  address,
  addressLockType,
  accountInfo,
  isAddressCorrect,
}: {
  address: string
  addressLockType: AddressLockType
  accountInfo: SUDTAccount | null
  isAddressCorrect: boolean
}) {
  const [extraCKB, setExtraCKB] = useState<string | undefined | null>()
  useEffect(() => {
    if (
      accountInfo?.tokenId &&
      accountInfo?.tokenId !== DEFAULT_SUDT_FIELDS.CKBTokenId &&
      isAddressCorrect &&
      address
    ) {
      getSUDTCellExtraCkb({
        address,
        tokenID: accountInfo.tokenId,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            setExtraCKB(res.result)
          }
        })
        .catch(() => {
          setExtraCKB(undefined)
        })
    } else {
      setExtraCKB(undefined)
    }
  }, [accountInfo, address, isAddressCorrect])
  return useMemo<Option[] | undefined>(() => {
    if (accountInfo?.tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId) {
      return undefined
    }
    if (addressLockType === AddressLockType.secp256) {
      return [
        {
          tValue: 'cheque-address-hint',
          key: SendType.secp256Cheque,
        },
        {
          tValue: 'extra-ckb-send-to-secp256',
          key: SendType.secp256NewCell,
          params: { assetName: accountInfo?.accountName },
        },
      ]
    }
    if (extraCKB) {
      return [
        {
          tValue: addressLockType === AddressLockType.acp ? 'extra-ckb-send-to-acp' : 'extra-ckb-send-to-unknow',
          key: addressLockType === AddressLockType.acp ? SendType.acpNewCell : SendType.unknowNewCell,
          params: { assetName: accountInfo?.accountName, extraCKB: shannonToCKBFormatter(extraCKB) },
        },
      ]
    }
    return undefined
  }, [addressLockType, extraCKB, accountInfo])
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
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { id, checked } = e.target as HTMLInputElement
      setSendType(checked ? (id as SendType) : undefined)
    },
    [setSendType]
  )
  return {
    sendType,
    onChange,
  }
}

export function getGenerator(sendType?: SendType) {
  if (sendType === SendType.secp256Cheque) {
    return generateChequeTransaction
  }
  return generateSUDTTransaction
}

export function useOnSumbit({
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
            actionType = addressLockType === AddressLockType.secp256 ? 'send-acp-ckb-to-new-cell' : 'send-ckb'
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
