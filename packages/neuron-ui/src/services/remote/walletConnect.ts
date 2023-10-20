import { ErrorResponse, SessionRequest } from 'ckb-walletconnect-wallet-sdk'
import { remoteApi } from './remoteApiWrapper'

export const connect = remoteApi<string>('wc-connect')
export const disconnect = remoteApi<string>('wc-disconnect')
export const approveSession = remoteApi<{
  id: number
  scriptBases: string[]
}>('wc-approve-session')
export const rejectSession = remoteApi<{
  id: number
  reason?: ErrorResponse
}>('wc-reject-session')
export const approveRequest = remoteApi<{
  event: SessionRequest
  options?: any
}>('wc-approve-request')
export const rejectRequest = remoteApi<{
  event: SessionRequest
  error?: ErrorResponse
}>('wc-reject-request')
