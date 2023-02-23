import initConnection from 'database/chain/ormconfig'
import logger from 'utils/logger'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import RpcService from 'services/rpc-service'

// Open connection to a network and maintain chain info in database.
export default class ChainInfo {
  private network: Network

  constructor(network: Network) {
    this.network = network
  }

  // Connect to the network and load chain info.
  // Returns true if the connected network's genesis hash matches.
  public load = async (): Promise<boolean> => {
    let genesisHash = EMPTY_GENESIS_HASH

    try {
      genesisHash = await new RpcService(this.network.remote).genesisBlockHash()
      // If fetched genesis hash doesn't match that of the network, still initalize DB.
      // This would mostly only happens when using default mainnet network but connected to a wrong node.
      await initConnection(genesisHash)

      return genesisHash === this.network.genesisHash
    } catch (err) {
      logger.error('Network:\tfail to connect to the network. Is CKB node running?')

      await initConnection(this.network.genesisHash)

      return false
    }
  }
}
