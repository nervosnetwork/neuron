import wallets from './wallets'
import networks from './networks'
import send from './send'
import transactions from './transactions'

export const actionCreators = {
  ...wallets,
  ...networks,
  ...send,
  ...transactions,
}

export default actionCreators
