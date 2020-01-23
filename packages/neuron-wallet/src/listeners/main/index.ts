import { register as registerTxDbChanged } from './tx-db-changed'
import { register as registerAddressDbChanged } from './address-db-changed'
import ProcessUtils from 'utils/process'

// register in app.ready
export const register = () => {
  if (ProcessUtils.isRenderer()) {
    throw new Error('Only call listeners/main in main process!')
  }
  registerTxDbChanged()
  registerAddressDbChanged()
}
