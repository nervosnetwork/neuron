export interface TargetOutput {
  address: string
  capacity: string
}

export enum TxSaveType {
  Sent = 'sent',
  Fetch = 'fetch',
}

export enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
  Failed = 'failed',
}
