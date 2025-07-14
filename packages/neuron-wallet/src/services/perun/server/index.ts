import { mkWalletServiceServer } from '@ckb-connect/perun-wallet-wrapper/dist/services'
import { IPCWalletBackend } from './wallet-backend'
import logger from '../../../utils/logger'

function main() {
  try {
    const localUrl = '127.0.0.1:50051'
    const backend = new IPCWalletBackend()
    const server = mkWalletServiceServer(backend, () => {
      return {}
    })
    server
      .listen(localUrl)
      .then(port => {
        logger.log(`Wallet service listening on localhost on port ${port}`)
      })
      .catch(error => {
        logger.error('Failed to start gRPC server:', error)
        process.exit(1)
      })
  } catch (e) {
    logger.error('GRPC:', e)
    process.exit(1)
  }
}

main()
