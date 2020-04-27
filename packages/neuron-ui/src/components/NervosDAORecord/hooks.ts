import { useEffect, useCallback } from 'react'
import { showTransactionDetails } from 'services/remote'
import { getHeaderByNumber } from 'services/chain'
import { MILLISECONDS_IN_YEAR } from 'utils/const'
import calculateAPC from 'utils/calculateAPC'

export const useUpdateWithdrawEpochs = ({
  isWithdrawn,
  blockNumber,
  setWithdrawEpoch,
  setWithdrawTimestamp,
}: {
  isWithdrawn: boolean
  blockNumber: CKBComponents.BlockNumber | null
  setWithdrawEpoch: React.Dispatch<string>
  setWithdrawTimestamp: React.Dispatch<string>
}) => {
  useEffect(() => {
    if (isWithdrawn && blockNumber) {
      getHeaderByNumber(BigInt(blockNumber))
        .then(header => {
          setWithdrawEpoch(header.epoch)
          setWithdrawTimestamp(header.timestamp)
        })
        .catch((err: Error) => {
          console.error(err)
        })
    }
  }, [isWithdrawn, blockNumber, setWithdrawEpoch, setWithdrawTimestamp])
}

export const useUpdateApc = ({
  depositTimestamp,
  genesisBlockTimestamp = 0,
  timestamp,
  tipBlockTimestamp,
  setApc,
}: {
  depositTimestamp: number
  genesisBlockTimestamp: number
  timestamp: number
  tipBlockTimestamp: number
  setApc: React.Dispatch<number>
}) => {
  useEffect(() => {
    if (depositTimestamp) {
      const startYearNumber = (depositTimestamp - genesisBlockTimestamp) / MILLISECONDS_IN_YEAR
      const endYearNumber = (timestamp - genesisBlockTimestamp) / MILLISECONDS_IN_YEAR
      try {
        const calculatedAPC = calculateAPC({
          startYearNumber,
          endYearNumber,
        })
        setApc(calculatedAPC)
      } catch (err) {
        console.error(err)
      }
    } else {
      const startYearNumber = (timestamp - genesisBlockTimestamp) / MILLISECONDS_IN_YEAR
      const endYearNumber = (tipBlockTimestamp - genesisBlockTimestamp) / MILLISECONDS_IN_YEAR
      try {
        const calculatedAPC = calculateAPC({
          startYearNumber,
          endYearNumber,
        })
        setApc(calculatedAPC)
      } catch (err) {
        console.error(err)
      }
    }
  }, [depositTimestamp, tipBlockTimestamp, timestamp, genesisBlockTimestamp, setApc])
}

export const useOnTxRecordClick = () =>
  useCallback((e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
    const {
      dataset: { txHash },
    } = e.target as HTMLButtonElement
    if (txHash) {
      showTransactionDetails(txHash)
    }
  }, [])

export default { useUpdateWithdrawEpochs, useUpdateApc, useOnTxRecordClick }
