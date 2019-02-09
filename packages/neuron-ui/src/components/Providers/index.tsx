import React, { useState } from 'react'
import ChainContext, { initChain, ICell } from '../../contexts/chain'
import WalletContext, { initWallet } from '../../contexts/wallet'
import { ipcRenderer } from '../../utils/ipc'
import { IPC_CHANNEL } from '../../utils/const'

const withProviders = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const [chain, setChain] = useState(initChain)
  const [wallet, setWallet] = useState(initWallet)
  ipcRenderer.on(IPC_CHANNEL.SEND_CAPACITY, (_e: any, args: { status: number; msg: string }) => {
    setWallet({ ...wallet, msg: args.msg })
  })

  ipcRenderer.on(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, (_e: Event, args: { status: number; result: ICell[] }) => {
    // TODO:
    if (args.status) {
      setChain({ ...chain, cells: args.result })
    }
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
