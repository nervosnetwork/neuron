import Core from '@nervosnetwork/ckb-sdk-core'

require('dotenv').config()

const { env } = process
if (!env.REMOTE) {
  throw new Error(`REMOTE is not set in .env`)
}

const ckbCore = new Core(env.REMOTE)

export default ckbCore
