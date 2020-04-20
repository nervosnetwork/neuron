import app from './app'
import wallets from './wallets'
import transactions from './transactions'
import settings from './settings'
import sudt from './sudt'

export * from './app'
export * from './wallets'
export * from './transactions'
export * from './settings'
export * from './sudt'
export const actionCreators = {
  ...app,
  ...wallets,
  ...transactions,
  ...settings,
  ...sudt,
}

export default actionCreators
