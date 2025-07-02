// PerunService is responsible for starting and stopping the Wallet-Backend

import logger from '../../utils/logger'
import { PerunServiceRunner } from './service-runner'

// GRPC server.
export default class PerunService {
  private static instance: PerunService

  static getInstance(): PerunService {
    if (!PerunService.instance) {
      logger.info('Creating new PerunService instance')
      PerunService.instance = new PerunService()
    }

    return PerunService.instance
  }

  // Start the GRPC server hosting the wallet-backend API.
  public async start() {
    logger.info('Starting PerunService runner')
    try {
      await PerunServiceRunner.getInstance().start()
    } catch (error) {
      logger.error('Failed to start PerunService GRPC server', error)
    }
  }
}
