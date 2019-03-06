import { ipcMain, Notification } from 'electron'
import { Channel } from './utils/const'
import { cell, transactions, transactionCount } from './mock'
import asw from './wallets/asw'
import WalletStore, { Wallet } from './store/WalletStore'
import OtherStore from './store/otherStore'

const walletStore = new WalletStore()
const otherStore = new OtherStore()

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
  ipcMain.on(Channel.CreateWallet, (e: Electron.Event, wallet: { name: string; mnemonic: any; password: string }) => {
    const notification = new Notification({
      title: 'Create Wallet',
      body: JSON.stringify(wallet),
    })
    notification.show()
    e.sender.send(Channel.CreateWallet, {
      status: 1,
      result: {
        name: wallet.name,
        address: 'wallet address',
        publicKey: 'asdfasfasdf',
      },
    })
  })

  /**
   * @name DeleteWallet
   */
  ipcMain.on(Channel.DeleteWallet, (e: Electron.Event, address: string) => {
    const notification = new Notification({
      title: 'Delete Wallet',
      body: address,
    })
    notification.show()
    setTimeout(() => {
      e.sender.send(Channel.DeleteWallet, {
        status: 1,
        result: `wallet of ${address} deleted`,
      })
      // should send current wallets to UILayer
    }, 1000)
  })

  /**
   * @name ImportWallet
   * @description channel to import wallet
   */
  ipcMain.on(Channel.ImportWallet, (e: Electron.Event, wallet: { name: string; mnemonic: any; password: string }) => {
    const notification = new Notification({
      title: 'Import Wallet',
      body: JSON.stringify(wallet),
    })
    notification.show()
    setTimeout(() => {
      e.sender.send(Channel.ImportWallet, {
        status: 1,
        result: `wallet imported`,
      })
    }, 1000)
  })

  /**
   * @name ExportWallet
   * @description channel to export wallet
   */
  ipcMain.on(Channel.ExportWallet, (e: Electron.Event) => {
    const notification = new Notification({
      title: 'Export Wallet',
      body: '',
    })
    notification.show()
    setTimeout(() => {
      e.sender.send(Channel.ExportWallet, {
        status: 1,
        result: 'wallet exported',
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
  ipcMain.on(
    Channel.GetTransactions,
    (e: Electron.Event, { pageNo, pageSize }: { pageNo: number; pageSize: number }) => {
      e.sender.send(Channel.GetTransactions, {
        status: 1,
        result: {
          pageNo,
          pageSize,
          totalCount: transactionCount,
          items: transactions.map(tx => ({
            ...tx,
            value: tx.value * pageNo * pageSize,
          })),
        },
      })
    },
  )

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

export const sendTransactionHistory = (win: Electron.BrowserWindow, pageNo: number, pageSize: number) => {
  win.webContents.send(Channel.GetTransactions, {
    status: 1,
    result: {
      pageNo,
      pageSize,
      totalCount: transactionCount,
      items: transactions.map(tx => ({
        ...tx,
        value: tx.value * pageNo * pageSize,
      })),
    },
  })
}

/**
 * @name saveWalletStore
 * @description channel to add or update wallet
 */
ipcMain.on(
  Channel.SaveWalletStore,
  (e: Electron.Event, { walletName, wallet }: { walletName: string; wallet: Wallet }) => {
    try {
      walletStore.saveWallet(walletName, wallet)
      e.sender.send(Channel.SaveWalletStore, {
        status: 1,
        result: 'saved wallet',
      })
    } catch (error) {
      e.sender.send(Channel.SaveWalletStore, {
        status: 0,
        result: error,
      })
    }
  },
)

/**
 * @name saveWalletStore
 * @description channel to get wallet name list
 */
ipcMain.on(Channel.GetWalletNameListStore, (e: Electron.Event) => {
  try {
    e.sender.send(Channel.GetWalletNameListStore, {
      status: 1,
      result: walletStore.getWalletNameList(),
    })
  } catch (error) {
    e.sender.send(Channel.GetWalletNameListStore, {
      status: 0,
      result: error,
    })
  }
})

/**
 * @name saveWalletStore
 * @description channel to get wallet name list
 */
ipcMain.on(Channel.GetWalletStore, (e: Electron.Event, { walletName }: { walletName: string }) => {
  try {
    e.sender.send(Channel.GetWalletStore, {
      status: 1,
      result: walletStore.getWallet(walletName),
    })
  } catch (error) {
    e.sender.send(Channel.GetWalletStore, {
      status: 0,
      result: error,
    })
  }
})

/**
 * @name saveWalletStore
 * @description channel to get wallet name list
 */
ipcMain.on(Channel.DeleteWalletStore, (e: Electron.Event, { walletName }: { walletName: string }) => {
  try {
    e.sender.send(Channel.DeleteWalletStore, {
      status: 1,
      result: walletStore.deleteWallet(walletName),
    })
  } catch (error) {
    e.sender.send(Channel.DeleteWalletStore, {
      status: 0,
      result: error,
    })
  }
})

/**
 * @name saveWalletStore
 * @description channel to get wallet name list
 */
ipcMain.on(
  Channel.RenameWalletStore,
  (e: Electron.Event, { newWalletName, oldWalletName }: { newWalletName: string; oldWalletName: string }) => {
    try {
      walletStore.renameWallet(newWalletName, oldWalletName)
      e.sender.send(Channel.RenameWalletStore, {
        status: 1,
        result: 'saved wallet',
      })
    } catch (error) {
      e.sender.send(Channel.RenameWalletStore, {
        status: 0,
        result: error,
      })
    }
  },
)

ipcMain.on(Channel.OtherStore, (e: Electron.Event, { key, value }: { key: string; value: string }) => {
  otherStore.save(key, value)
  e.sender.send(Channel.OtherStore, {
    status: 1,
    result: 'saved',
  })
})

export default listenToChannel
