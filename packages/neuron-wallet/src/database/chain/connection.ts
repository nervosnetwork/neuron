import { ConnectionName, dataSource } from './ormconfig'
import { NetworkType } from '../../models/network'
import NetworksService from '../../services/networks'

export function getCurrentConnectionName(): ConnectionName {
  return NetworksService.getInstance().getCurrent()?.type === NetworkType.Light ? 'light' : 'full'
}

export function getConnection(connectionName: ConnectionName = getCurrentConnectionName()) {
  const connection = dataSource[connectionName]
  if (!connection) {
    throw new Error(`The connection ${connectionName} should be initialized before use`)
  }
  return connection
}
