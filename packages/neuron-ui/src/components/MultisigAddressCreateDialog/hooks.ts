import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createMultisigAddress } from 'services/remote'
import { isSuccessResponse } from 'utils'

export enum Step {
  setMN = 0,
  setMultiAddress,
  viewMultiAddress,
}

export const useMAndN = () => {
  const [m, changeM] = useState('')
  const [n, changeN] = useState('')
  const changeMBySelect = useCallback(
    (value: string) => {
      if (!Number.isNaN(Number(value))) {
        changeM(value)
      }
    },
    [changeM]
  )
  const changeNBySelect = useCallback(
    (value: string) => {
      if (!Number.isNaN(Number(value))) {
        changeN(value)
      }
    },
    [changeN]
  )
  const isError = useMemo(() => {
    return !m || !n || Number(m) > Number(n)
  }, [m, n])
  return {
    m,
    n,
    changeMBySelect,
    changeNBySelect,
    isError,
  }
}

export const useMultiAddress = ({ n }: { n: number }) => {
  const [addresses, changeAddresses] = useState(new Array(n).fill(''))
  const [r, setR] = useState(0)
  const changeR = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setR(e.target.checked ? index + 1 : index)
    },
    [setR]
  )
  const changeAddress = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      changeAddresses(addresses.map((item, idx) => (index === idx ? e.target.value : item)))
    },
    [changeAddresses, addresses]
  )
  const isError = useMemo(() => {
    return addresses.some(v => !v)
  }, [addresses])
  useEffect(() => {
    changeAddresses(new Array(n).fill(''))
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
