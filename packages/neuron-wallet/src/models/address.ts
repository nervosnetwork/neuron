import { AddressType } from 'models/keys/address';

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet'
}

export interface Address {
  walletId: string;
  address: string;
  path: string;
  addressType: AddressType;
  addressIndex: number;
  blake160: string;
  txCount?: number;
  liveBalance?: string;
  sentBalance?: string;
  pendingBalance?: string;
  balance?: string;
  version?: AddressVersion;
  description?: string;
  isImporting?: boolean | undefined;
  usedByAnyoneCanPay?: boolean | undefined;
}
