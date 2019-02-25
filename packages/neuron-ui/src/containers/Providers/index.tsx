import React, { useState, useEffect } from 'react'
import ChainContext, { initChain, Cell, Transaction } from '../../contexts/Chain'
import WalletContext, { initWallet } from '../../contexts/Wallet'
import SettingsContext, { initSettings } from '../../contexts/Settings'

import ipc, { ipcRenderer } from '../../utils/ipc'
import { Channel, NetworkStatus } from '../../utils/const'

interface Response<T> {
  status: number
  result: T
  msg?: string
}

const withProviders = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const [chain, setChain] = useState(initChain)
  const [wallet, setWallet] = useState(initWallet)
  const [settings] = useState(initSettings)

  useEffect(() => {
    ipc.asw()
  }, [])
  ipcRenderer.on('ASW', (_e: any, args: Response<any>) => {
    if (wallet) {
      setWallet({
        ...wallet,
        name: 'asw',
        wallet: args.result,
      })
    }
  })

  ipcRenderer.on(Channel.GetNetwork, (_e: Event, args: Response<{ remote: { url: string }; connected: boolean }>) => {
    setChain({
      ...chain,
      network: {
        ip: args.result.remote.url,
        status: args.result.connected ? NetworkStatus.Online : NetworkStatus.Offline,
      },
    })
  })

  ipcRenderer.on(Channel.GetBalance, (_e: Event, args: Response<number>) => {
    if (args.status) {
      if (wallet)
        setWallet({
          ...wallet,
          balance: args.result,
        })
    }
  })

  ipcRenderer.on(Channel.SendCapacity, (_e: Event, args: Response<any>) => {
    console.debug(args.msg)
  })

  ipcRenderer.on(Channel.GetCellsByTypeHash, (_e: Event, args: Response<Cell[]>) => {
    // TODO:
    if (args.status) {
      setChain({
        ...chain,
        cells: args.result,
      })
    }
  })

  ipcRenderer.on(
    Channel.GetTransactions,
    (_e: Event, args: Response<{ count: number; transactions: Transaction[] }>) => {
      // TODO:
      if (args.status) {
        setChain({
          ...chain,
          transactions: {
            count: args.result.count,
            items: args.result.transactions,
          },
        })
      }
    },
  )

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
