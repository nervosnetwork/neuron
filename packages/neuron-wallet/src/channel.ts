import { ipcMain, Notification } from 'electron'
import Core from '@nervosnetwork/ckb-sdk-core'
import { Channel } from './utils/const'
import { cell, transactions, transactionCount } from './mock'

const remote = 'http://localhost:8114'
export const ckbCore = new Core(remote)
const asw = ckbCore.wallet.newASW()

const listenToChannel = () => {
  // chain
  /**
   * @name GetLiveCell
   * @description channel to get live cell
   */
  ipcMain.on(Channel.GetLiveCell, (e: Electron.Event, ...args: string[]) => {
    e.sender.send(Channel.GetLiveCell, args)
  })

  // wallet
  /**
   * @name CreateWallet
   * @description channel to create wallet
   */
  ipcMain.on(Channel.CreateWallet, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.CreateWallet, {
        status: 1,
        result: {
          name: 'wallet name',
          address: 'wallet address',
        },
      })
    }, 1000)
  })

  /**
   * @name ImportWallet
   * @description channel to import wallet
   */
  ipcMain.on(Channel.ImportWallet, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.ImportWallet, {
        status: 1,
      })
    }, 1000)
  })

  /**
   * @name ExportWallet
   * @description channel to export wallets
   */
  ipcMain.on(Channel.ExportWallet, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.ExportWallet, {
        status: 1,
        result: 'wallets',
      })
    }, 1000)
  })

  /**
   * @name SwitchWallet
   * @description channel to switch wallet
   */
  ipcMain.on(Channel.SwitchWallet, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.SwitchWallet, {
        status: 1,
        wallet: 'wallet',
      })
    }, 1000)
  })

  /**
   * @name GetBalance
   * @description channel to get balance
   */
  ipcMain.on(Channel.GetBalance, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.GetBalance, {
        status: 1,
        result: 'balance',
      })
    }, 1000)
  })

  // channel to get cells by type hash
  /**
   * @name GetCellsByTypeHash
   * @description channel to get cells by typehash
   */
  ipcMain.on(Channel.GetCellsByTypeHash, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.GetCellsByTypeHash, {
        status: 1,
        result: [cell],
      })
    }, 1000)
  })

  ipcMain.on('ASW', (e: Electron.Event) => {
    e.sender.send('ASW', {
      status: 1,
      result: asw,
    })
  })

  /**
   * @name GetUnspentCells
   * @description channel to get unspent cells
   */
  ipcMain.on(Channel.GetUnspentCells, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.GetUnspentCells, {
        status: 1,
        result: ['cells'],
      })
    }, 1000)
  })

  /**
   * @name GetTransactions
   * @description get transactions
   */
  ipcMain.on(Channel.GetTransactions, (e: Electron.Event, { page, pageSize }: { page: number; pageSize: number }) => {
    e.sender.send(Channel.GetTransactions, {
      status: 1,
      result: {
        count: transactionCount,
        transactions: transactions.map(tx => ({
          ...tx,
          value: tx.value * page * pageSize,
        })),
      },
    })
  })

  /**
   * @name Get GetWallets
   * @description channel to get wallets
   */
  ipcMain.on(Channel.GetWallets, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.GetWallets, {
        status: 1,
        result: ['wallet'],
      })
    }, 1000)
  })

  /**
   * @name SendCapacity
   * @description channel to send capacity
   */
  ipcMain.on(
    Channel.SendCapacity,
    (e: Electron.Event, { address, capacity }: { address: string; capacity: number }) => {
      const notification = new Notification({
        title: 'Send Capacity',
        body: `Send Capacity to CKB with ${JSON.stringify(
          {
            address,
            capacity,
          },
          null,
          2,
        )}`,
      })
      notification.show()
      setTimeout(() => {
        e.sender.send(Channel.SendCapacity, {
          status: 1,
          msg: `Send ${capacity} Capacity to ${address} Successfully`,
        })
      }, 1000)
    },
  )

  /**
   * @name SendTransaction
   * @description channel to send transaction
   */
  ipcMain.on(Channel.SendTransaction, (e: Electron.Event) => {
    const notification = new Notification({
      title: 'Send Transaction',
      body: 'transaction detail',
    })
    notification.show()
    setTimeout(() => {
      e.sender.send(Channel.SendTransaction, {
        status: 1,
        result: {
          hash: 'transaction hash',
        },
      })
    }, 1000)
  })

  /**
   * @name sign
   * @description channel to sign msg
   */
  ipcMain.on(Channel.Sign, (e: Electron.Event) => {
    setTimeout(() => {
      e.sender.send(Channel.Sign, {
        status: 1,
        result: 'signed msg',
      })
    }, 1000)
  })
}

export default listenToChannel
