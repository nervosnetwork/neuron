import NodeService from 'services/node'
import RpcService from 'services/rpc-service'

export const deindexLockHashes = async (lockHashes: string[]) => {
  const { ckb } = NodeService.getInstance()
  const url: string = ckb.rpc.node.url
  const rpcService = new RpcService(url)

  for (const lockHash of lockHashes) {
    await rpcService.deindexLockHash(lockHash)
  }
}
