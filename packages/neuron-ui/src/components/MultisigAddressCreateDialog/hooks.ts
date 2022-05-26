import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { validateAddress, isSecp256k1Address, getMultisigAddress } from 'utils'
import { useTranslation } from 'react-i18next'
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'

export enum Step {
  setMN = 0,
  setMultiAddress,
  viewMultiAddress,
}

export const useMAndN = () => {
  const [m, setM] = useState('')
  const [n, setN] = useState('')
  const setMBySelect = useCallback(
    (value: string) => {
      if (!Number.isNaN(Number(value))) {
        setM(value)
      }
    },
    [setM]
  )
  const setNBySelect = useCallback(
    (value: string) => {
      if (!Number.isNaN(Number(value))) {
        setN(value)
      }
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
    if (numM < 1 || numM > 255 || numN < 1 || numN > 255) {
      return 'm-n-between-0-255'
    }
    return undefined
  }, [m, n])
  return {
    m,
    n,
    setMBySelect,
    setNBySelect,
    errorI18nKey,
  }
}

export const useMultiAddress = ({ n, isMainnet }: { n: number; isMainnet: boolean }) => {
  const [t] = useTranslation()
  const [addresses, setAddresses] = useState(new Array(n).fill(''))
  const [addressErrors, setAddressErrors] = useState<((Error & { i18n: Record<string, string> }) | undefined)[]>(
    new Array(n).fill(undefined)
  )
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
        setAddressErrors(v => v.map((item, index) => (index === +idx ? error : item)))
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
  step,
  m,
  n,
  r,
  addresses,
  isMainnet,
}: {
  step: Step
  m: number
  n: number
  r: number
  addresses: string[]
  isMainnet: boolean
}) => {
  const [multisigAddress, changeMultisigAddress] = useState('')
  useEffect(() => {
    if (step === Step.viewMultiAddress) {
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
  }, [step, changeMultisigAddress, m, n, r, addresses, isMainnet])
  return multisigAddress
}
