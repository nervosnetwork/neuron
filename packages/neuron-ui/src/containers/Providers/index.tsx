import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ChainContext, { initChain, Cell, Transaction } from '../../contexts/Chain'
import WalletContext, { initWallet } from '../../contexts/Wallet'
import SettingsContext, { initSettings } from '../../contexts/Settings'

import UILayer from '../../services/UILayer'
import { Channel, NetworkStatus } from '../../utils/const'

const withProviders = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const [chain, setChain] = useState(initChain)
  const [wallet, setWallet] = useState(initWallet)
  const [settings] = useState(initSettings)
  const [, i18n] = useTranslation()

  UILayer.on(Channel.SetLanguage, (_e: Event, lng: string) => {
    if (lng !== i18n.language) {
      i18n.changeLanguage(lng)
    }
  })

  UILayer.on('ASW', (_e: any, args: Response<any>) => {
    setWallet({
      ...wallet,
      ...args.result,
    })
  })

  UILayer.on(
    Channel.CreateWallet,
    (_e: Event, args: Response<{ name: string; address: string; publicKey: Uint8Array }>) => {
      if (args.status) {
        // TODO: handle created wallet
      }
    },
  )

  UILayer.on(Channel.DeleteWallet, (_e: Event, args: Response<string>) => {
    if (args.status) {
      // TODO: handle wallet deleted
    }
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

  UILayer.on(Channel.GetUnspentCells, (_e: Event, args: Response<any>) => {
    // TODO:
    if (args.status) {
      setChain({
        ...chain,
        cells: args.result,
      })
    }
  })

  UILayer.on(
    Channel.GetTransactions,
    (_e: Event, args: Response<{ totalCount: number; items: Transaction[]; pageNo: number; pageSize: number }>) => {
      // TODO:
      if (args.status) {
        setChain({
          ...chain,
          transactions: args.result,
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
