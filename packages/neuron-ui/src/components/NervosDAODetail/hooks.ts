import { useEffect } from 'react'
import { StateAction } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'
import { getHeaderByNumber } from 'services/chain'

export const useInitData = ({
  dispatch,
  wallet,
  setGenesisBlockTimestamp,
}: {
  dispatch: React.Dispatch<StateAction>
  wallet: State.Wallet
  setGenesisBlockTimestamp?: React.Dispatch<React.SetStateAction<number | undefined>>
}) =>
  useEffect(() => {
    updateNervosDaoData({ walletID: wallet.id })(dispatch)
    const intervalId = setInterval(() => {
      updateNervosDaoData({ walletID: wallet.id })(dispatch)
    }, 10000)
    getHeaderByNumber('0x0')
      .then(header => setGenesisBlockTimestamp?.(+header.timestamp))
      .catch(err => console.error(err))
    return () => {
      clearInterval(intervalId)
      clearNervosDaoData()(dispatch)
    }
    // eslint-disable-next-line
  }, [])

export default { useInitData }
