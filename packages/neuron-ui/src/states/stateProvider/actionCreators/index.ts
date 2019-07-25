import app from './app'
import wallets from './wallets'
import transactions from './transactions'
import settings from './settings'

export * from './app'
export * from './wallets'
export * from './transactions'
export * from './settings'
export const actionCreators = {
  ...app,
  ...wallets,
  ...transactions,
  ...settings,
}

export default actionCreators
