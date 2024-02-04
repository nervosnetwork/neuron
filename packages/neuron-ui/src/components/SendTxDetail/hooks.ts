import { useCallback, useState } from 'react'

export const useShowBalance = () => {
  const [isBalanceShow, setIsBalanceShow] = useState(true)
  return {
    isBalanceShow,
    onChange: useCallback(() => {
      setIsBalanceShow((v: boolean) => !v)
    }, []),
  }
}

export default useShowBalance
