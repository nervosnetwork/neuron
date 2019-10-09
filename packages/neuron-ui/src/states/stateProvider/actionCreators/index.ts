import app from './app'
import wallets from './wallets'
import transactions from './transactions'
import settings from './settings'
import skipDataAndType from './skipDataAndType'

export * from './app'
export * from './wallets'
export * from './transactions'
export * from './settings'
export * from './skipDataAndType'
export const actionCreators = {
  ...app,
  ...wallets,
  ...transactions,
  ...settings,
  ...skipDataAndType,
}

export default actionCreators
