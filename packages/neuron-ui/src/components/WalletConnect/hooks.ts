import { useCallback } from 'react'
import { useState as useGlobalState } from 'states'
import { connect, disconnect, approveSession, rejectSession, approveRequest, rejectRequest } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { SessionRequest } from 'ckb-walletconnect-wallet-sdk'

export const useWalletConnect = () => {
  const {
    walletConnect: { proposals, sessions, requests, identity },
  } = useGlobalState()

  const onConnect = useCallback(async (uri: string) => {
    const res: ControllerResponse = await connect(uri)
    return res
  }, [])

  const onDisconnect = useCallback(async (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const { topic } = e.currentTarget.dataset
    if (topic) {
      await disconnect(topic)
    }
  }, [])

  const onApproveSession = useCallback(async (id, scriptBases) => {
    const res: ControllerResponse = await approveSession({
      id: Number(id),
      scriptBases,
    })
    return res
  }, [])

  const onRejectSession = useCallback(async (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const { id } = e.currentTarget.dataset
    await rejectSession({ id: Number(id) })
  }, [])

  const onApproveRequest = useCallback(
    async (event: SessionRequest, options: any) => {
      const res: ControllerResponse = await approveRequest({ event, options })
      return res
    },
    [requests]
  )

  const onRejectRequest = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const { id } = e.currentTarget.dataset
      const event = requests.find(item => item.id === Number(id))
      if (event) {
        await rejectRequest({ event })
      }
    },
    [requests]
  )

  const userName = `${identity.slice(0, 6)}...${identity.slice(-6)}`

  return {
    proposals,
    sessions,
    requests,
    onConnect,
    onDisconnect,
    onRejectRequest,
    onApproveRequest,
    onRejectSession,
    onApproveSession,
    userName,
  }
}

export const useSession = () => {}
