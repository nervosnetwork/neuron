import wallet from './wallet'
import networks from './networks'
import transfer from './transfer'
import transactions from './transactions'

export const actionCreators = {
  ...wallet,
  ...networks,
  ...transfer,
  ...transactions,
}

export default actionCreators
