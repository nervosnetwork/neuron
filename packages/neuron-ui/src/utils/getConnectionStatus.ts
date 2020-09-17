import { ConnectionStatus } from './enums'

export const getConnectionStatus = (status: Omit<Subject.ConnectionStatus, 'url'> & { isTimeout: boolean }) => {
  const connectionStatus = status.connected ? ConnectionStatus.Online : ConnectionStatus.Offline
  if (
    connectionStatus === ConnectionStatus.Offline &&
    (!status.isTimeout || (status.isBundledNode && status.startedBundledNode))
  ) {
    return ConnectionStatus.Connecting
  }

  return connectionStatus
}

export default getConnectionStatus
