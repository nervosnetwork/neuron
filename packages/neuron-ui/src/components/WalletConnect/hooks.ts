import { useCallback } from 'react'
import { useState as useGlobalState } from 'states'
import { connect, disconnect, approveSession, rejectSession, approveRequest, rejectRequest } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'

export const useWalletConnect = () => {
  const {
    walletConnect: { proposals, sessions, requests, identity },
  } = useGlobalState()

  const onConnect = useCallback(async (type, uri: string) => {
    const res: ControllerResponse = await connect({
      type,
      uri,
    })
    return res
  }, [])

  const onDisconnect = useCallback(async e => {
    const { topic } = e.target.dataset
    const res: ControllerResponse = await disconnect(topic)
    return res
  }, [])

  const onApproveSession = useCallback(async (id, scriptBases) => {
    const res: ControllerResponse = await approveSession({
      id: Number(id),
      scriptBases,
    })
    return res
  }, [])

  const onRejectSession = useCallback(async e => {
    const { id } = e.target.dataset
    await rejectSession({ id: Number(id) })
  }, [])

  const onApproveRequest = useCallback(
    async (event, options) => {
      const res: ControllerResponse = await approveRequest({ event, options })
      return res
    },
    [requests]
  )

  const onRejectRequest = useCallback(
    async e => {
      const { id } = e.target.dataset
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
