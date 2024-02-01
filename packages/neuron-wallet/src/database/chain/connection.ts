import { getConnection as originGetConnection } from 'typeorm'
import { NetworkType } from '../../models/network'
import NetworksService from '../../services/networks'

export type ConnectionName = 'light' | 'full'

export function getCurrentConnectionName(): ConnectionName {
  return NetworksService.getInstance().getCurrent()?.type === NetworkType.Light ? 'light' : 'full'
}

export function getConnection(connectionName: ConnectionName = getCurrentConnectionName()) {
  const connection = originGetConnection(connectionName)
  if (!connection) {
    throw new Error(`The connection ${connectionName} should be initialized before use`)
  }
  return connection
}
