import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { validateAddress, isSecp256k1Address, getMultisigAddress } from 'utils'
import { useTranslation } from 'react-i18next'
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ErrorWithI18n, isErrorWithI18n } from 'exceptions'
import { MAX_M_N_NUMBER } from 'utils/const'

const handleEvent = (e: React.SyntheticEvent<HTMLInputElement>, cb: (val: string) => void) => {
  const { value } = e.currentTarget
  let val = Number(value)
  if (val > MAX_M_N_NUMBER) {
    val = MAX_M_N_NUMBER
  }
  if (!Number.isNaN(val)) {
    cb(val ? `${val}` : '')
  }
}

export const useMAndN = () => {
  const [m, setM] = useState('')
  const [n, setN] = useState('')

  const setMByInput = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      handleEvent(e, setM)
    },
    [setM]
  )
  const setNByInput = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      handleEvent(e, setN)
    },
    [setN]
  )
  const errorI18nKey: string | undefined = useMemo(() => {
    if (!m || !n) {
      return 'm-n-required'
    }
    const numM = Number(m)
    const numN = Number(n)
    if (numM > numN) {
      return 'm-less-equal-n'
    }
    if (numM < 1 || numM > MAX_M_N_NUMBER || numN < 1 || numN > MAX_M_N_NUMBER) {
      return 'm-n-between-0-255'
    }
    return undefined
  }, [m, n])
  return {
    m,
    n,
    setMByInput,
    setNByInput,
    errorI18nKey,
  }
}

export const useMultiAddress = ({ n, isMainnet }: { n: number; isMainnet: boolean }) => {
  const [t] = useTranslation()
  const [addresses, setAddresses] = useState(new Array(n).fill(''))
  const [addressErrors, setAddressErrors] = useState<(ErrorWithI18n | undefined)[]>(new Array(n).fill(undefined))
  const [r, setR] = useState(0)
  const changeR = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {
        checked,
        dataset: { idx = -1 },
      } = e.target
      setR(checked ? +idx + 1 : +idx)
    },
    [setR]
  )
  const changeAddress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {
        value,
        dataset: { idx = -1 },
      } = e.target
      try {
        validateAddress(value, isMainnet)
        if (!isSecp256k1Address(value)) {
          throw new Error(t(`messages.secp256k1/blake160-address-required`))
        }
        setAddressErrors(v => v.map((item, index) => (index === +idx ? undefined : item)))
      } catch (error) {
        if (isErrorWithI18n(error)) {
          const i18nErr: ErrorWithI18n = error
          setAddressErrors(v => v.map((item, index) => (index === +idx ? i18nErr : item)))
        }
      }
      setAddresses(v => v.map((item, index) => (+idx === index ? value : item)))
    },
    [setAddresses, isMainnet, setAddressErrors, t]
  )
  const isAddressesDuplicated = useMemo(() => {
    const notEmptyAddresses = addresses.filter(v => !!v)
    return new Set(notEmptyAddresses).size !== notEmptyAddresses.length
  }, [addresses])
  const isError = useMemo(() => {
    return isAddressesDuplicated || addresses.some((v, idx) => !v || addressErrors[idx])
  }, [addresses, addressErrors, isAddressesDuplicated])
  useEffect(() => {
    setAddresses(new Array(n).fill(''))
    setAddressErrors(new Array(n).fill(undefined))
    setR(0)
  }, [n, setAddressErrors])
  return {
    r,
    addresses,
    changeR,
    changeAddress,
    isError,
    addressErrors,
    isAddressesDuplicated,
  }
}

export const useViewMultisigAddress = ({
  isView,
  m,
  n,
  r,
  addresses,
  isMainnet,
}: {
  isView: boolean
  m: number
  n: number
  r: number
  addresses: string[]
  isMainnet: boolean
}) => {
  const [multisigAddress, changeMultisigAddress] = useState('')
  useEffect(() => {
    if (isView) {
      try {
        const address = getMultisigAddress(
          addresses.map(v => addressToScript(v).args),
          r,
          m,
          n,
          isMainnet
        )
        changeMultisigAddress(address)
      } catch (error) {
        // ignore error. The ui ensures the correctness of the parameters
      }
    }
  }, [isView, changeMultisigAddress, m, n, r, addresses, isMainnet])
  return multisigAddress
}
