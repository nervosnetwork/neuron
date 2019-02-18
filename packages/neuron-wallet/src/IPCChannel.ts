import { ipcMain } from 'electron'
import { IPCChannel } from './utils/const'
import { cell } from './mock'

const listenToChannel = () => {
  // chain
  /**
   * @name GetLiveCell
   * @description channel to get live cell
   */
  ipcMain.on(IPCChannel.GetLiveCell, (e: Electron.Event, ...args: string[]) => {
    e.sender.send(IPCChannel.GetLiveCell, args)
  })

  // wallet
  /**
   * @name CreateWallet
   * @description channel to create wallet
   */
  ipcMain.on(IPCChannel.CreateWallet, (e: Electron.Event) => {
    console.info('create a wallet')
    setTimeout(() => {
      e.sender.send(IPCChannel.CreateWallet, {
        status: 1,
        result: {
          name: 'wallet name',
          addr: 'wallet addr',
        },
      })
    }, 1000)
  })
  /**
   * @name ImportWallet
   * @description channel to import wallet
   */
  ipcMain.on(IPCChannel.ImportWallet, (e: Electron.Event) => {
    console.info('import a wallet')
    setTimeout(() => {
      e.sender.send(IPCChannel.ImportWallet, {
        status: 1,
      })
    }, 1000)
  })
  /**
   * @name ExportWallet
   * @description channel to export wallets
   */
  ipcMain.on(IPCChannel.ExportWallet, (e: Electron.Event) => {
    console.info('export wallets')
    setTimeout(() => {
      e.sender.send(IPCChannel.ExportWallet, {
        status: 1,
        result: 'wallets',
      })
    }, 1000)
  })
  /**
   * @name SwitchWallet
   * @description channel to switch wallet
   */
  ipcMain.on(IPCChannel.SwitchAccount, (e: Electron.Event) => {
    console.info('switch wallet')
    setTimeout(() => {
      e.sender.send(IPCChannel.SwitchAccount, {
        status: 1,
        wallet: 'wallet',
      })
    }, 1000)
  })
  /**
   * @name GetBalance
   * @description channel to get balance
   */
  ipcMain.on(IPCChannel.GetBalance, (e: Electron.Event) => {
    console.info('get balance')
    setTimeout(() => {
      e.sender.send(IPCChannel.GetBalance, {
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
  ipcMain.on(IPCChannel.GetCellsByTypeHash, (e: Electron.Event, ...args: string[]) => {
    console.info(`get cells by type hash ${args[0]}`)
    setTimeout(() => {
      e.sender.send(IPCChannel.GetCellsByTypeHash, {
        status: 1,
        result: [cell],
      })
    }, 1000)
  })
  /**
   * @name GetUnspentCells
   * @description channel to get unspent cells
   */
  ipcMain.on(IPCChannel.GetUnspentCells, (e: Electron.Event) => {
    console.info('get unspent cells')
    setTimeout(() => {
      e.sender.send(IPCChannel.GetUnspentCells, {
        status: 1,
        result: ['cells'],
      })
    }, 1000)
  })
  /**
   * @name GetTransactions
   * @description get transactions
   */
  ipcMain.on(IPCChannel.GetTransactions, (e: Electron.Event) => {
    console.info('get transactions')
    setTimeout(() => {
      e.sender.send(IPCChannel.GetTransactions, {
        status: 1,
        result: ['transaction'],
      })
    })
  })
  /**
   * @name Get GetWallets
   * @description channel to get wallets
   */
  ipcMain.on(IPCChannel.GetWallets, (e: Electron.Event) => {
    console.info('get wallets')
    setTimeout(() => {
      e.sender.send(IPCChannel.GetWallets, {
        status: 1,
        result: ['wallet'],
      })
    })
  })
  /**
   * @name SendCapacity
   * @description channel to send capacity
   */
  ipcMain.on(IPCChannel.SendCapacity, (e: Electron.Event, { addr, capacity }: { addr: string; capacity: number }) => {
    console.info(`Send Capacity to CKB with ${JSON.stringify({ addr, capacity }, null, 2)}`)
    setTimeout(() => {
      e.sender.send(IPCChannel.SendCapacity, {
        status: 1,
        msg: `Send ${capacity} Capacity to ${addr} Successfully`,
      })
    }, 1000)
  })
  /**
   * @name SendTransaction
   * @description channel to send transaction
   */
  ipcMain.on(IPCChannel.SendTransaction, (e: Electron.Event) => {
    console.info('send transaction')
    setTimeout(() => {
      e.sender.send(IPCChannel.SendTransaction, {
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
  ipcMain.on(IPCChannel.Sign, (e: Electron.Event) => {
    console.info('sign message')
    setTimeout(() => {
      e.sender.send(IPCChannel.Sign, {
        status: 1,
        result: 'signed msg',
      })
    }, 1000)
  })
}

export default listenToChannel
