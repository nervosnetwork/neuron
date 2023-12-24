import React, { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import RadioGroup from 'widgets/RadioGroup'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { requestPassword } from 'services/remote'
import PasswordRequest from 'components/PasswordRequest'
import styles from './detectDuplicateWalletDialog.module.scss'

const DetectDuplicateWalletDialog = ({ onClose }: { onClose: () => void }) => {
  const {
    wallet: { id: currentID = '' },
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [deletableWallets, setDeletableWallets] = useState<string[]>([])
  const [t] = useTranslation()

  const groups = useMemo(() => {
    const obj = {} as {
      [key: string]: State.WalletIdentity[]
    }
    wallets.forEach(item => {
      if (item.extendedKey in obj) {
        obj[item.extendedKey].push(item)
      } else {
        obj[item.extendedKey] = [item]
      }
    })

    return Object.values(obj).filter(list => list.length > 1)
  }, [wallets])

  const handleGroupChange = useCallback(
    (checked: string | number) => {
      const [extendedKey, id] = (checked as string).split('_')
      const list: string[] = []
      wallets.forEach(item => {
        if (item.extendedKey === extendedKey) {
          if (item.id !== id) {
            list.push(item.id)
          }
        } else if (deletableWallets.includes(item.id)) {
          list.push(item.id)
        }
      })

      setDeletableWallets(list)
    },
    [wallets, deletableWallets, setDeletableWallets]
  )

  const onConfirm = useCallback(async () => {
    const getRequest = (id: string) => {
      if (wallets.find(item => item.id === id && item.device)) {
        return requestPassword({ walletID: id, action: 'delete-wallet' })
      }
      return new Promise(resolve => {
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: id,
            actionType: 'delete',
            onSuccess: async () => {
              await resolve(id)
            },
          },
        })
      })
    }

    let ids = [...deletableWallets]
    if (deletableWallets.includes(currentID)) {
      ids = ids.filter(item => item !== currentID)
      ids.push(currentID)
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await getRequest(id)
    }
    onClose()
  }, [wallets, deletableWallets, requestPassword, onClose, dispatch])

  return (
    <>
      <Dialog
        show
        title={t('settings.wallet-manager.detected-duplicate.title')}
        onCancel={onClose}
        onConfirm={onConfirm}
        disabled={deletableWallets.length === 0}
      >
        <div className={styles.content}>
          <p className={styles.detail}>{t('settings.wallet-manager.detected-duplicate.detail')}</p>
          <div className={styles.groupWrap}>
            {groups.map(group => (
              <RadioGroup
                inputIdPrefix="detect-duplicate-wallet"
                key={group[0].extendedKey}
                defaultValue=""
                onChange={handleGroupChange}
                itemClassName={styles.radioItem}
                options={group.map(wallet => ({
                  value: `${wallet.extendedKey}_${wallet.id}`,
                  label: <span className={styles.walletName}>{wallet.name}</span>,
                }))}
              />
            ))}
          </div>
        </div>
      </Dialog>
      <PasswordRequest />
    </>
  )
}

DetectDuplicateWalletDialog.displayName = 'DetectDuplicateWalletDialog'

export default DetectDuplicateWalletDialog
