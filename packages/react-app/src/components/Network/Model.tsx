export enum NetworkStatus {
  unknown = 'unknown',
  connectionSucceeded = 'Connection succeeded',
  connectionFailed = 'Connection failed',
}

export interface NetworkStatusModel {
  node: string
  tipBlockNumbe?: number
  status: NetworkStatus
  date: string
}
