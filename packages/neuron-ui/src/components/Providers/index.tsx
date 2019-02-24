import React, { useState, useEffect } from 'react'
import ChainContext, { initChain, ICell } from '../../contexts/Chain'
import WalletContext, { initWallet } from '../../contexts/Wallet'
import SettingsContext, { initSettings } from '../../contexts/Settings'

import ipc, { ipcRenderer } from '../../utils/ipc'
import { Channel, NetworkStatus } from '../../utils/const'

const withProviders = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const [chain, setChain] = useState(initChain)
  const [wallet, setWallet] = useState(initWallet)
  const [settings] = useState(initSettings)

  useEffect(() => {
    ipc.asw()
  }, [])

  ipcRenderer.on('ASW', (_e: any, args: { status: number; result: any }) => {
    setWallet({
      ...wallet,
      name: 'asw',
      wallet: args.result,
    })
  })

  ipcRenderer.on(
    Channel.GetNetwork,
    (_e: Event, args: { status: number; result: { remote: { url: string }; connected: boolean } }) => {
      setChain({
        ...chain,
        network: {
          ip: args.result.remote.url,
          status: args.result.connected ? NetworkStatus.Online : NetworkStatus.Offline,
        },
      })
    },
  )

  ipcRenderer.on(Channel.SendCapacity, (_e: any, args: { status: number; msg: string }) => {
    console.debug(args.msg)
  })

  ipcRenderer.on(Channel.GetCellsByTypeHash, (_e: Event, args: { status: number; result: ICell[] }) => {
    // TODO:
    if (args.status) {
      setChain({
        ...chain,
        cells: args.result,
      })
    }
  })
  return (
    <SettingsContext.Provider value={settings}>
      <ChainContext.Provider value={chain}>
        <WalletContext.Provider value={wallet}>
          <Comp {...props} />
        </WalletContext.Provider>
      </ChainContext.Provider>
    </SettingsContext.Provider>
  )
}

export default withProviders
