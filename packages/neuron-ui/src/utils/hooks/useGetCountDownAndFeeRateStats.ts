import { useState, useEffect, useCallback } from 'react'
import { getFeeRateStatistics } from 'services/chain'
import { MEDIUM_FEE_RATE, METHOD_NOT_FOUND } from 'utils/const'

type CountdownOptions = {
  seconds?: number
  interval?: number
}

const useGetCountDownAndFeeRateStats = ({ seconds = 30, interval = 1000 }: CountdownOptions = {}) => {
  const [countDown, setCountDown] = useState(seconds)
  const [feeFatestatsData, setFeeFatestatsData] = useState<{
    mean?: string
    median?: string
    suggestFeeRate: number
  }>({ suggestFeeRate: MEDIUM_FEE_RATE })

  const handleGetFeeRateStatistics = useCallback(() => {
    getFeeRateStatistics()
      .then(res => {
        const { median } = res ?? {}
        const suggested = median ? Math.max(1000, Number(median)) : MEDIUM_FEE_RATE

        setFeeFatestatsData(states => ({ ...states, ...res, suggestFeeRate: suggested }))
      })
      .catch((err: Error & { response?: { status: number } }) => {
        try {
          if (err?.response?.status === 404) {
            throw new Error('method not found')
          }
          const errMsg = JSON.parse(err.message)
          if (errMsg?.code === METHOD_NOT_FOUND) {
            throw new Error('method not found')
          }
        } catch (error) {
          setFeeFatestatsData(states => ({ ...states, suggestFeeRate: MEDIUM_FEE_RATE }))
        }
      })
  }, [])

  useEffect(() => {
    const countInterval = setInterval(() => {
      setCountDown(count => (count <= 0 ? seconds : count - 1))
    }, interval)

    return () => {
      clearInterval(countInterval)
    }
  }, [])

  useEffect(() => {
    if (countDown === seconds) {
      handleGetFeeRateStatistics()
    }
  }, [countDown, seconds])

  return { countDown, ...feeFatestatsData }
}

export default useGetCountDownAndFeeRateStats
