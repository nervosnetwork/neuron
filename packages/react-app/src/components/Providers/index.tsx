import React, { useState, useContext } from 'react'
import ChainContext from '../../contexts/chain'
import WalletContext, { initWallet } from '../../contexts/wallet'
import { ipcRenderer } from '../../utils/ipc'
import { IPC_CHANNEL } from '../../utils/const'

const withProviders = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const chain = useContext(ChainContext)
  const [wallet, setWallet] = useState(initWallet)
  ipcRenderer.on(IPC_CHANNEL.SEND_CAPACITY, (_e: any, args: { status: number; msg: string }) => {
    setWallet({ msg: args.msg })
  })

  ipcRenderer.on(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, () => {
    // TODO:
  })

  return (
    <ChainContext.Provider value={chain}>
      <WalletContext.Provider value={wallet}>
        <Comp {...props} />
      </WalletContext.Provider>
    </ChainContext.Provider>
  )
}

export default withProviders
