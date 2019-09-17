import IndexerRPC from "./indexer-rpc"
import NodeService from '../node'

export const deindexLockHashes = async (lockHashes: string[]) => {
  const { core } = NodeService.getInstance()
  const url: string = core.rpc.node.url
  const indexerRPC = new IndexerRPC(url)

  for (const lockHash of lockHashes) {
    await indexerRPC.deindexLockHash(lockHash)
  }
}
