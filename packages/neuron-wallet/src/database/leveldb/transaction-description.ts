// Transaction description is stored in LevelDB separated from Sqlite3 data,
// to keep persisted. Sqlite3 transaction table gets cleaned when user clears
// cache or sync rebuilds txs.

import { txdb } from './'

const makeKey = (walletID: string, txHash: string): string => {
  return `description:${walletID}:${txHash}`

}

export const get = async (walletID: string, txHash: string) => {
  return txdb.get(makeKey(walletID, txHash)).catch(() => (''))
}

export const set = (walletID: string, txHash: string, description: string) => {
  return txdb.put(makeKey(walletID, txHash), description)
}
