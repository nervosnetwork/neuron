import React, { useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch, dismissGlobalAlertDialog } from 'states'
import { useMigrate, useOnDefaultContextMenu, useOnLocaleChange } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import RadioGroup from 'widgets/RadioGroup'
import NetworkEditorDialog from 'components/NetworkEditorDialog'
import { AddSimple } from 'widgets/Icons/icon'
import styles from './main.module.scss'
import { useSubscription, useSyncChainData, useOnCurrentWalletChange, useCheckNode } from './hooks'

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

  const network = useMemo(() => networks.find(n => n.id === networkID), [networks, networkID])

  const sameUrlNetworks = useMemo(
    () => networks.filter(v => v.remote === network?.remote && !v.readonly),
    [network, networks]
  )

  useSyncChainData({
    chainURL: network?.remote ?? '',
    dispatch,
  })

  const {
    isSwitchNetworkShow,
    showSwitchNetwork,
    onCancel: onCloseSwitchNetwork,
    onConfirm: onSwitchNetwork,
    onChangeSelected,
    showEditorDialog,
    onCloseEditorDialog,
    onOpenEditorDialog,
  } = useCheckNode(sameUrlNetworks, networkID)

  useSubscription({
    walletID,
    chain,
    isAllowedToFetchList,
    navigate,
    dispatch,
    location,
    showSwitchNetwork,
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
      <Dialog
        show={isSwitchNetworkShow}
        onCancel={onCloseSwitchNetwork}
        onConfirm={sameUrlNetworks.length ? onSwitchNetwork : onOpenEditorDialog}
        confirmText={sameUrlNetworks.length ? undefined : t('main.external-node-detected-dialog.add-network')}
        cancelText={t('main.external-node-detected-dialog.ignore-external-node')}
        title={t('main.external-node-detected-dialog.title')}
        className={styles.networkDialog}
      >
        {sameUrlNetworks.length ? (
          <span className={styles.chooseNetworkTip}>
            {t('main.external-node-detected-dialog.body-tips-with-network')}
          </span>
        ) : (
          t('main.external-node-detected-dialog.body-tips-without-network')
        )}
        {sameUrlNetworks.length ? (
          <>
            <div className={styles.networks}>
              <RadioGroup
                onChange={onChangeSelected}
                options={sameUrlNetworks.map(v => ({
                  value: v.id,
                  label: `${v.name} (${v.remote})`,
                }))}
                inputIdPrefix="main-switch"
              />
            </div>
            <div className={styles.addNetwork}>
              <Button type="text" onClick={onOpenEditorDialog}>
                <AddSimple />
                {t('main.external-node-detected-dialog.add-network')}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>
      {showEditorDialog ? (
        <NetworkEditorDialog
          url={network?.remote}
          onSuccess={onCloseEditorDialog}
          onCancel={onCloseEditorDialog}
          id="new"
        />
      ) : null}
    </div>
  )
}

MainContent.displayName = 'Main'

export default MainContent
