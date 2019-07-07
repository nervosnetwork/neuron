import wallets from './wallets'
import networks from './networks'
import send from './send'
import transactions from './transactions'
import settings from './settings'

export const actionCreators = {
  ...wallets,
  ...networks,
  ...send,
  ...transactions,
  ...settings,
}

export default actionCreators
