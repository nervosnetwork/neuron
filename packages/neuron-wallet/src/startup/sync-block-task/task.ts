import { ipcRenderer } from 'electron'
import { register as registerTxStatusListener, unregister as unregisterTxStatusListener } from 'listeners/renderer/tx-status'
import IndexerRPC from 'services/indexer/indexer-rpc'

import { switchNetwork as syncSwitchNetwork } from './sync'
import { switchNetwork as indexerSwitchNetwork } from './indexer'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'

const testIndexer = async (url: string): Promise<boolean> => {
  const indexerRPC = new IndexerRPC(url)
  try {
    await CommonUtils.retry(3, 100, () => {
      return indexerRPC.getLockHashIndexStates()
    })
    return true
  } catch {
    return false
  }
}

ipcRenderer.on('block-sync:start', async (_, url: string, genesisHash: string) => {
  logger.debug("=== block-sync:start", url, genesisHash)

  if (await testIndexer(url)) {
    await indexerSwitchNetwork(url, genesisHash)
  } else {
    await syncSwitchNetwork(url, genesisHash)
  }
})

ipcRenderer.on('sync-window-will-close', () => {
  unregisterTxStatusListener()
})

registerTxStatusListener()
