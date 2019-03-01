import Core from '@nervosnetwork/ckb-sdk-core'
import env from './env'

if (!env.remote) {
  throw new Error(`REMOTE is not set in .env`)
}

const ckbCore = new Core(env.remote)

export default ckbCore
