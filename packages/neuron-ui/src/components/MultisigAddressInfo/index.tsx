import React from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import CopyZone from 'widgets/CopyZone'

import styles from './multisig-address-info.module.scss'

export const MultisigAddressTable = ({
  r,
  addresses,
  changeR,
  changeAddress,
  disabled,
  addressErrors,
}: {
  r: number
  addresses: string[]
  changeR?: (e: React.ChangeEvent<HTMLInputElement>) => void
  changeAddress?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  addressErrors?: ((Error & { i18n: Record<string, string> }) | undefined)[]
}) => {
  const [t] = useTranslation()
  return (
    <>
      <table className={styles.multiAddressTable}>
        <thead>
          <tr>
            {['index', 'required', 'signer-address'].map(field => (
              <th key={field}>{t(`multisig-address.create-dialog.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addresses.map((v, idx) => (
            <tr key={idx.toString()}>
              <td className={styles.index}>{`#${idx + 1}`}</td>
              <td className={styles.required}>
                <input
                  type="checkbox"
                  data-idx={idx}
                  onChange={changeR}
                  checked={idx < r}
                  disabled={idx > r || disabled}
                />
              </td>
              <td>
                {disabled ? (
                  <CopyZone
                    content={v}
                    className={styles.copyzone}
                    name={t('multisig-address.create-dialog.copy-address')}
                  >
                    <span className={styles.overflow}>{v.slice(0, -6)}</span>
                    <span>...</span>
                    <span>{v.slice(-6)}</span>
                  </CopyZone>
                ) : (
                  <TextField
                    field={`${idx}_address`}
                    data-idx={idx}
                    value={v}
                    className={styles.addressField}
                    onChange={changeAddress}
                    disabled={disabled}
                    placeholder={t('multisig-address.create-dialog.multi-address-info.ckb-address-placeholder')}
                    error={addressErrors?.[idx] ? t(addressErrors[idx]!.message, addressErrors[idx]!.i18n) : undefined}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

const MultiSignAddressInfo = ({
  m,
  n,
  r,
  addresses,
  multisigAddress,
}: {
  m: string
  n: string
  r: number
  addresses: string[]
  multisigAddress: string
}) => {
  const [t] = useTranslation()
  return (
    <>
      <p>{t('multisig-address.create-dialog.multi-address-info.view-title', { m, n })}</p>
      <CopyZone
        content={multisigAddress}
        className={styles.copyzone}
        name={t('multisig-address.create-dialog.copy-address')}
      >
        <span className={styles.overflow}>{multisigAddress.slice(0, -6)}</span>
        <span>...</span>
        <span>{multisigAddress.slice(-6)}</span>
      </CopyZone>
      <p>{t('multisig-address.create-dialog.multi-list', { m, n })}</p>
      <MultisigAddressTable r={r} addresses={addresses} disabled />
    </>
  )
}

MultiSignAddressInfo.displayName = 'MultiSignAddressInfo'

export default MultiSignAddressInfo
