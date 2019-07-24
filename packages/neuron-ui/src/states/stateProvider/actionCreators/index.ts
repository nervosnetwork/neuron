import wallets from './wallets'
import send from './send'
import transactions from './transactions'
import settings from './settings'

export const actionCreators = {
  ...wallets,
  ...send,
  ...transactions,
  ...settings,
}

export default actionCreators
