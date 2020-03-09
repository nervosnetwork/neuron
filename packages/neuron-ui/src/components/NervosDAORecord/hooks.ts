import { useEffect } from 'react'
import { getHeaderByNumber } from 'services/chain'
import { MILLISECONDS_IN_YEAR } from 'utils/const'
import calculateAPC from 'utils/calculateAPC'

export const useUpdateEpochs = ({
  depositOutPoint,
  blockNumber,
  setWithdrawingEpoch,
}: {
  depositOutPoint: CKBComponents.OutPoint | undefined
  blockNumber: CKBComponents.BlockNumber
  setWithdrawingEpoch: React.Dispatch<string>
}) => {
  useEffect(() => {
    if (depositOutPoint) {
      // It's under withdrawing, the block number is the one that withdrawing starts at
      getHeaderByNumber(BigInt(blockNumber))
        .then(header => {
          setWithdrawingEpoch(header.epoch)
        })
        .catch((err: Error) => {
          console.error(err)
        })
    }
  }, [depositOutPoint, blockNumber, setWithdrawingEpoch])
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

export default { useUpdateEpochs, useUpdateApc }
