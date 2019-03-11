import Core from '@nervosnetwork/ckb-sdk-core'
import env from './env'

if (!env.remote) {
  throw new Error(`REMOTE is not set in .env`)
}

const ckbCore = new Core(env.remote)
Object.defineProperty(ckbCore.node, 'name', {
  value: 'Default Remote',
})

export default ckbCore
