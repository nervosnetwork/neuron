import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import RadioGroup from 'widgets/RadioGroup'
import { useState as useGlobalState, useDispatch, updateWalletProperty, setCurrentWallet } from 'states'
import { RoutePath, isSuccessResponse } from 'utils'
import { replaceWallet } from 'services/remote'
import styles from './replaceDuplicateWalletDialog.module.scss'

const useReplaceDuplicateWallet = () => {
  const [duplicateWalletIds, setDuplicateWalletIds] = useState([])
  const [importedWalletId, setImportedWalletId] = useState('')

  const onClose = useCallback(() => {
    setImportedWalletId('')
  }, [setImportedWalletId])

  const onImportingExitingWalletError = (
    message:
      | string
      | {
          content?: string
          meta?: { [key: string]: string }
        }
  ) => {
    try {
      const msg = typeof message === 'string' ? '' : message.content
      if (msg) {
        const obj = JSON.parse(msg)
        setDuplicateWalletIds(obj.duplicateWalletIds)
        setImportedWalletId(obj.id)
      }
    } catch (error) {
      onClose()
    }
  }

  const show = useMemo(() => !!duplicateWalletIds.length && !!importedWalletId, [importedWalletId, duplicateWalletIds])

  return {
    onImportingExitingWalletError,
    dialogProps: {
      show,
      onClose,
      duplicateWalletIds,
      importedWalletId,
    },
  }
}

const ReplaceDuplicateWalletDialog = ({
  show,
  onClose,
  duplicateWalletIds,
  importedWalletId,
}: {
  show: boolean
  onClose: () => void
  duplicateWalletIds: string[]
  importedWalletId: string
}) => {
  const {
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('')
  const [t] = useTranslation()

  const group = useMemo(
    () => wallets.filter(item => duplicateWalletIds.includes(item.id)),
    [wallets, duplicateWalletIds]
  )

  const handleGroupChange = useCallback(
    (checked: string) => {
      setSelectedId(checked as string)
    },
    [setSelectedId]
  )

  const onConfirm = useCallback(() => {
    replaceWallet({
      existingWalletId: selectedId,
      importedWalletId,
    })
      .then(res => {
        if (isSuccessResponse(res)) {
          navigate(RoutePath.Overview)
          return
        }
        onClose()
      })
      .finally(() => {
        setSelectedId('')
      })
  }, [selectedId, updateWalletProperty, onClose, dispatch, setCurrentWallet])

  return (
    <Dialog
      show={show}
      title={t('settings.wallet-manager.importing-existing.title')}
      onCancel={onClose}
      onConfirm={onConfirm}
      confirmText={t('settings.wallet-manager.importing-existing.replace')}
      disabled={!selectedId}
    >
      <div className={styles.content}>
        <p className={styles.detail}>{t('settings.wallet-manager.importing-existing.detail')}</p>
        <div className={styles.groupWrap}>
          <RadioGroup
            inputIdPrefix="replace-duplicate-wallet"
            defaultValue=""
            onChange={handleGroupChange}
            itemClassName={styles.radioItem}
            options={group.map(wallet => ({
              value: wallet.id,
              label: <span className={styles.walletName}>{wallet.name}</span>,
            }))}
          />
        </div>
      </div>
    </Dialog>
  )
}

ReplaceDuplicateWalletDialog.displayName = 'ReplaceDuplicateWalletDialog'

export default ReplaceDuplicateWalletDialog

export { useReplaceDuplicateWallet }
