import { useState, useEffect, useCallback } from 'react'
import { getFeeRateStats } from 'services/chain'
import { AppActions, StateDispatch, useDispatch } from 'states'
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
  const dispatch = useDispatch()

  const handleGetFeeRateStatis = useCallback(
    (stateDispatch: StateDispatch) => {
      getFeeRateStats()
        .then(res => {
          if (res) {
            const { mean, median } = res
            const suggested = mean && median ? Math.max(1000, Number(mean), Number(median)) : MEDIUM_FEE_RATE
  
            setFeeFatestatsData(states => ({ ...states, ...res, suggestFeeRate: suggested }))
          }
        })
        .catch((err: Error) => {
          try {
            const errMsg = JSON.parse(err.message)
            if (errMsg?.code === METHOD_NOT_FOUND) {
              return
            }
          } catch (error) {
            //ignore, show error default
          }
          stateDispatch({
            type: AppActions.AddNotification,
            payload: {
              type: 'alert',
              timestamp: +new Date(),
              content: err.message,
            },
          })
        })
    },
    [getFeeRateStats, setFeeFatestatsData]
  )

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
      handleGetFeeRateStatis(dispatch)
    }
  }, [countDown, seconds, dispatch])

  return { countDown, ...feeFatestatsData }
}

export default useGetCountDownAndFeeRateStats
