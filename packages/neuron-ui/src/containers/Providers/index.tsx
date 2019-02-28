import React, { useState, useEffect } from 'react'
import ChainContext, { initChain, Cell, Transaction } from '../../contexts/Chain'
import WalletContext, { initWallet } from '../../contexts/Wallet'
import SettingsContext, { initSettings } from '../../contexts/Settings'

import UILayer, { asw } from '../../services/UILayer'
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
    asw()
  }, [])

  UILayer.on('ASW', (_e: any, args: Response<any>) => {
    setWallet({
      ...wallet,
      name: 'asw',
      ...args.result,
    })
  })

  UILayer.on(Channel.GetNetwork, (_e: Event, args: Response<{ remote: { url: string }; connected: boolean }>) => {
    if (args.status) {
      setChain({
        ...chain,
        network: {
          ip: args.result.remote.url,
          status: args.result.connected ? NetworkStatus.Online : NetworkStatus.Offline,
        },
      })
    }
  })

  UILayer.on(Channel.GetBalance, (_e: Event, args: Response<number>) => {
    if (args.status) {
      setWallet({
        ...wallet,
        balance: args.result,
      })
    }
  })

  UILayer.on(Channel.SendCapacity, () => {
    // TODO
  })

  UILayer.on(Channel.GetCellsByTypeHash, (_e: Event, args: Response<Cell[]>) => {
    // TODO:
    if (args.status) {
      setChain({
        ...chain,
        cells: args.result,
      })
    }
  })

  UILayer.on(Channel.GetTransactions, (_e: Event, args: Response<{ count: number; transactions: Transaction[] }>) => {
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
  })

  UILayer.on(Channel.NavTo, (_e: Event, args: Response<any>) => {
    window.location.href = args.result.router
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
