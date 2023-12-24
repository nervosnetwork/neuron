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
  const [extendedKey, setExtendedKey] = useState('')
  const [tmpId, setTmpId] = useState('')

  const onClose = useCallback(() => {
    setTmpId('')
  }, [setTmpId])

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
        setExtendedKey(obj.extendedKey)
        setTmpId(obj.id)
      }
    } catch (error) {
      onClose()
    }
  }

  const show = useMemo(() => !!extendedKey && !!tmpId, [tmpId, extendedKey])

  return {
    onImportingExitingWalletError,
    dialogProps: {
      show,
      onClose,
      extendedKey,
      tmpId,
    },
  }
}

const ReplaceDuplicateWalletDialog = ({
  show,
  onClose,
  extendedKey,
  tmpId,
}: {
  show: boolean
  onClose: () => void
  extendedKey: string
  tmpId: string
}) => {
  const {
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('')
  const [t] = useTranslation()

  const group = useMemo(() => wallets.filter(item => item.extendedKey === extendedKey), [wallets, extendedKey])

  const handleGroupChange = useCallback(
    (checked: string | number) => {
      setSelectedId(checked as string)
    },
    [setSelectedId]
  )

  const onConfirm = useCallback(async () => {
    replaceWallet({
      id: selectedId,
      tmpId,
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
