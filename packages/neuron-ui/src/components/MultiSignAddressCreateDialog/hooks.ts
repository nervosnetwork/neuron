import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createMultiSignAddress } from 'services/remote'
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
  const [blake160s, changeAddresses] = useState(new Array(n).fill(''))
  const [r, setR] = useState(0)
  const changeR = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setR(e.target.checked ? index + 1 : index)
    },
    [setR]
  )
  const changeAddress = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      changeAddresses(blake160s.map((item, idx) => (index === idx ? e.target.value : item)))
    },
    [changeAddresses, blake160s]
  )
  const isError = useMemo(() => {
    return blake160s.some(v => !v)
  }, [blake160s])
  useEffect(() => {
    changeAddresses(new Array(n).fill(''))
    setR(0)
  }, [n])
  return {
    r,
    blake160s,
    changeR,
    changeAddress,
    isError,
  }
}

export const useViewMultiSignAddress = ({
  step,
  m,
  n,
  r,
  blake160s,
  isMainnet,
}: {
  step: Step
  m: number
  n: number
  r: number
  blake160s: string[]
  isMainnet: boolean
}) => {
  const [multiSignAddress, changeMultiSignAddress] = useState('')
  useEffect(() => {
    if (step === Step.viewMultiAddress) {
      createMultiSignAddress({
        r,
        m,
        n,
        blake160s,
        isMainnet,
      }).then(res => {
        if (isSuccessResponse(res) && res.result) {
          changeMultiSignAddress(res.result)
        }
      })
    }
  }, [step, changeMultiSignAddress, m, n, r, blake160s, isMainnet])
  return multiSignAddress
}
