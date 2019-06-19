import Utils from '../../services/sync/utils'
import NodeService from '../../services/node'

const { core } = NodeService.getInstance()

export const genesisBlockHash = async () => {
  const hash: string = await Utils.retry(3, 100, async () => {
    const h: string = await core.rpc.getBlockHash('0')
    return h
  })

  return hash
}

export default genesisBlockHash
