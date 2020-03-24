// Transaction description is stored in LevelDB separated from Sqlite3 data,
// to keep persisted. Sqlite3 transaction table gets cleaned when user clears
// cache or sync rebuilds txs.

import { maindb } from './'

const makeKey = (walletID: string, txHash: string): string => {
  return `tx_desc:${walletID}:${txHash}`
}

export const get = async (walletID: string, txHash: string) => {
  return maindb.get(makeKey(walletID, txHash)).catch(() => (''))
}

export const set = (walletID: string, txHash: string, description: string) => {
  return maindb.put(makeKey(walletID, txHash), description)
}
