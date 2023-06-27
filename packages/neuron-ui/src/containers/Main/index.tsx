import React, { useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch } from 'states'
import { useOnDefaultContextMenu, useOnLocaleChange } from 'utils'
import { useSubscription, useSyncChainData, useOnCurrentWalletChange } from './hooks'

const MainContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    app: { isAllowedToFetchList = true },
    wallet: { id: walletID = '' },
    chain,
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const { networkID } = chain
  const [t, i18n] = useTranslation()

  useSubscription({
    walletID,
    chain,
    isAllowedToFetchList,
    navigate,
    dispatch,
    location,
  })

  const chainURL = useMemo(() => {
    const network = networks.find(n => n.id === networkID)
    return network ? network.remote : ''
  }, [networks, networkID])

  useSyncChainData({
    chainURL,
    dispatch,
  })

  useOnCurrentWalletChange({
    walletID,
    chain,
    navigate,
    dispatch,
  })
  useOnLocaleChange(i18n)
  const onContextMenu = useOnDefaultContextMenu(t)

  return (
    <div onContextMenu={onContextMenu}>
      <Outlet />
    </div>
  )
}

MainContent.displayName = 'Main'

export default MainContent
