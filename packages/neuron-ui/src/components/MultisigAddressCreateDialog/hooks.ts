import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createMultisigAddress } from 'services/remote'
import { isSuccessResponse, validateAddress } from 'utils'

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
  const isError = useMemo(() => {
    return !m || !n || Number(m) > Number(n)
  }, [m, n])
  return {
    m,
    n,
    setMBySelect,
    setNBySelect,
    isError,
  }
}

export const useMultiAddress = ({ n, isMainnet }: { n: number; isMainnet: boolean }) => {
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
        setAddressErrors(v => v.map((item, index) => (index === +idx ? undefined : item)))
      } catch (error) {
        setAddressErrors(v => v.map((item, index) => (index === +idx ? error : item)))
      }
      setAddresses(v => v.map((item, index) => (+idx === index ? value : item)))
    },
    [setAddresses, isMainnet, setAddressErrors]
  )
  const isError = useMemo(() => {
    return addresses.some((v, idx) => !v || addressErrors[idx])
  }, [addresses, addressErrors])
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
      createMultisigAddress({
        r,
        m,
        n,
        addresses,
        isMainnet,
      }).then(res => {
        if (isSuccessResponse(res) && res.result) {
          changeMultisigAddress(res.result)
        }
      })
    }
  }, [step, changeMultisigAddress, m, n, r, addresses, isMainnet])
  return multisigAddress
}
