import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { MultisigConfig } from 'services/remote'
import MultisigAddressInfo, { MultisigAddressTable } from 'components/MultisigAddressInfo'
import { isMainnet as isMainnetUtil } from 'utils'
import Dialog from 'widgets/Dialog'
import TextField from 'widgets/TextField'
import { useMAndN, useMultiAddress, useViewMultisigAddress } from './hooks'
import styles from './multisigAddressCreateDialog.module.scss'

const SetMN = ({
  m,
  n,
  changeM,
  changeN,
  errorI18nKey,
}: {
  m: string
  n: string
  changeM: (e: React.SyntheticEvent<HTMLInputElement>) => void
  changeN: (e: React.SyntheticEvent<HTMLInputElement>) => void
  errorI18nKey?: string
}) => {
  const [t] = useTranslation()

  return (
    <div className={styles.setMNRoot}>
      <p className={styles.title}>{t('multisig-address.create-dialog.m-n.title')}</p>
      <div className={styles.countSelect}>
        <TextField
          value={m}
          placeholder={t('multisig-address.create-dialog.placeholder', { type: 'm' })}
          onChange={changeM}
          width="100%"
        />
        <p>of</p>
        <TextField
          value={n}
          placeholder={t('multisig-address.create-dialog.placeholder', { type: 'n' })}
          onChange={changeN}
          width="100%"
        />
      </div>
      {errorI18nKey && <span className={styles.error}>{t(`multisig-address.create-dialog.m-n.${errorI18nKey}`)}</span>}
    </div>
  )
}

const MultisigAddressCreateDialog = ({
  closeDialog,
  confirm: saveConfig,
}: {
  closeDialog: () => void
  confirm: (v: Omit<MultisigConfig, 'id' | 'walletId' | 'fullPayload' | 'blake160s'>) => Promise<void>
}) => {
  const [isView, setIsPreview] = useState(false)
  const [t] = useTranslation()
  const { m, n, setMByInput, setNByInput, errorI18nKey: mnErr } = useMAndN()
  const [confirmErr, setConfirmErr] = useState<string | null>(null)
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const {
    r,
    addresses,
    changeR,
    changeAddress,
    isError: addressErr,
    addressErrors,
    isAddressesDuplicated,
  } = useMultiAddress({
    n: Number(n),
    isMainnet,
  })
  const multisigAddress = useViewMultisigAddress({
    m: Number(m),
    n: Number(n),
    r,
    addresses,
    isView,
    isMainnet,
  })

  const confirm = useCallback(() => {
    saveConfig({
      m: Number(m),
      n: Number(n),
      r: Number(r),
      addresses,
    })
      .then(() => {
        closeDialog()
      })
      .catch(err => {
        setConfirmErr(err.message)
      })
  }, [m, n, r, addresses, saveConfig, closeDialog])

  const handleCancel = useCallback(() => {
    if (isView) {
      setIsPreview(false)
    } else {
      closeDialog()
    }
  }, [closeDialog, isView, setIsPreview])

  const handleConfirm = useCallback(() => {
    if (isView) {
      confirm()
    } else {
      setIsPreview(true)
    }
  }, [confirm, isView, setIsPreview])

  return (
    <Dialog
      show
      title={t(`multisig-address.create-dialog.${isView ? 'preview-title' : 'title'}`)}
      onCancel={handleCancel}
      cancelText={t('multisig-address.create-dialog.actions.back')}
      onConfirm={handleConfirm}
      confirmText={t(`multisig-address.create-dialog.actions.${isView ? 'confirm' : 'generate-address'}`)}
      disabled={!isView && (!!mnErr || addressErr)}
    >
      <div>
        {isView ? (
          <MultisigAddressInfo m={m} n={n} r={r} addresses={addresses} multisigAddress={multisigAddress} />
        ) : (
          <div>
            <SetMN m={m} n={n} changeM={setMByInput} changeN={setNByInput} errorI18nKey={mnErr} />
            <p className={styles.title}>{t('multisig-address.create-dialog.multi-address-info.title', { m, n })}</p>
            <MultisigAddressTable
              r={r}
              addresses={mnErr ? ['', ''] : addresses}
              changeR={changeR}
              changeAddress={changeAddress}
              addressErrors={addressErrors}
              disabled={!!mnErr}
            />
            {isAddressesDuplicated && (
              <div className={styles.errorMessage}>{t('multisig-address.create-dialog.duplicate-address-forbid')}</div>
            )}
          </div>
        )}
        {confirmErr && <div className={styles.errorMessage}>{confirmErr}</div>}
      </div>
    </Dialog>
  )
}

MultisigAddressCreateDialog.displayName = 'MultisigAddressCreateDialog'

export default MultisigAddressCreateDialog
