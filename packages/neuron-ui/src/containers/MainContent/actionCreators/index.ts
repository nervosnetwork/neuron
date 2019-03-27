import wallets from './wallets'
import networks from './networks'
import transfer from './transfer'
import transactions from './transactions'

export const actionCreators = {
  ...wallets,
  ...networks,
  ...transfer,
  ...transactions,
}

export default actionCreators
