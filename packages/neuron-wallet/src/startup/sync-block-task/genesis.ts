import Core from '@nervosnetwork/ckb-sdk-core'
import Utils from 'services/sync/utils'

export const genesisBlockHash = async (url: string) => {
  const core = new Core(url)
  const hash: string = await Utils.retry(3, 100, async () => {
    const h: string = await core.rpc.getBlockHash('0x0')
    return h
  })

  return hash
}

export default genesisBlockHash
