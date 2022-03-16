import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createMultisigAddress } from 'services/remote'
import { isSuccessResponse } from 'utils'

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

export const useMultiAddress = ({ n }: { n: number }) => {
  const [addresses, setAddresses] = useState(new Array(n).fill(''))
  const [r, setR] = useState(0)
  const changeR = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setR(e.target.checked ? index + 1 : index)
    },
    [setR]
  )
  const changeAddress = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setAddresses(v => v.map((item, idx) => (index === idx ? value : item)))
    },
    [setAddresses]
  )
  const isError = useMemo(() => {
    return addresses.some(v => !v)
  }, [addresses])
  useEffect(() => {
    setAddresses(new Array(n).fill(''))
    setR(0)
  }, [n])
  return {
    r,
    addresses,
    changeR,
    changeAddress,
    isError,
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
