import React, { useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch, dismissGlobalAlertDialog } from 'states'
import { useMigrate, useOnDefaultContextMenu, useOnLocaleChange } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import { useSubscription, useSyncChainData, useOnCurrentWalletChange } from './hooks'

const MainContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    app: { isAllowedToFetchList = true, globalAlertDialog },
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
    dismissGlobalAlertDialog()(dispatch)
  }, [dispatch])
  const { isMigrateDialogShow, onCancel, onBackUp, onConfirm } = useMigrate()

  return (
    <div onContextMenu={onContextMenu}>
      <Outlet />
      <AlertDialog
        show={!!globalAlertDialog}
        title={globalAlertDialog?.title}
        message={globalAlertDialog?.message}
        action={globalAlertDialog?.action}
        type={globalAlertDialog?.type ?? 'success'}
        onCancel={onCancelGlobalDialog}
      />
      <Dialog show={isMigrateDialogShow} onCancel={onCancel} title={t('messages.migrate-ckb-data')} showFooter={false}>
        {t('messages.rebuild-sync')
          .split('\n')
          .map((s: string) => (
            <p key={s}>{s}</p>
          ))}
        <div style={{ display: 'flex', justifyContent: 'end', columnGap: '24px' }}>
          <Button type="cancel" label={t('common.cancel')} onClick={onCancel} />
          <Button type="primary" label={t('common.backup')} onClick={onBackUp} />
          <Button type="primary" label={t('messages.migrate')} onClick={onConfirm} />
        </div>
      </Dialog>
    </div>
  )
}

MainContent.displayName = 'Main'

export default MainContent
