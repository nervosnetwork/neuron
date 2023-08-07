import React, { useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch, dismissAlertDialog } from 'states'
import { useOnDefaultContextMenu, useOnLocaleChange } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import { useSubscription, useSyncChainData, useOnCurrentWalletChange } from './hooks'

const MainContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    app: { isAllowedToFetchList = true, alertDialog },
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
  const onCancelGlobalDialog = useCallback(() => {
    dismissAlertDialog()(dispatch)
  }, [dispatch])

  return (
    <div onContextMenu={onContextMenu}>
      <Outlet />
      <AlertDialog
        show={!!alertDialog}
        title={alertDialog?.title}
        message={alertDialog?.message}
        type={alertDialog?.type ?? 'success'}
        onCancel={onCancelGlobalDialog}
      />
    </div>
  )
}

MainContent.displayName = 'Main'

export default MainContent
