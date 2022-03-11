import React from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import CopyZone from 'widgets/CopyZone'

import styles from './multi-sign-address-info.module.scss'

export const MultiSignAddressTable = ({
  r,
  blake160s,
  changeR,
  changeAddress,
  disabled,
}: {
  r: number
  blake160s: string[]
  changeR?: (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => void
  changeAddress?: (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}) => {
  const [t] = useTranslation()
  return (
    <>
      <table className={styles.multiAddressTable}>
        <thead>
          <tr>
            {['index', 'required', 'signer-address'].map(field => (
              <th key={field}>{t(`multi-sign-address.create-dialog.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blake160s.map((v, idx) => (
            <tr key={v}>
              <td className={styles.index}>{`#${idx + 1}`}</td>
              <td className={styles.required}>
                <input
                  type="checkbox"
                  onChange={changeR ? changeR(idx) : undefined}
                  checked={idx < r}
                  disabled={idx > r || disabled}
                />
              </td>
              <td>
                {disabled ? (
                  <CopyZone
                    content={v}
                    className={styles.copyzone}
                    name={t('multi-sign-address.create-dialog.copy-address')}
                  >
                    <span className={styles.overflow}>{v.slice(0, -6)}</span>
                    <span>...</span>
                    <span>{v.slice(-6)}</span>
                  </CopyZone>
                ) : (
                  <TextField
                    field="address"
                    value={v}
                    className={styles.addressField}
                    onChange={changeAddress ? changeAddress(idx) : undefined}
                    disabled={disabled}
                    placeholder={t('multi-sign-address.create-dialog.multi-address-info.ckb-address-placeholder')}
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
  blake160s,
  multiSignAddress,
}: {
  m: string
  n: string
  r: number
  blake160s: string[]
  multiSignAddress: string
}) => {
  const [t] = useTranslation()
  return (
    <>
      <p>{t('multi-sign-address.create-dialog.multi-address-info.view-title', { m, n })}</p>
      <CopyZone
        content={multiSignAddress}
        className={styles.copyzone}
        name={t('multi-sign-address.create-dialog.copy-address')}
      >
        <span className={styles.overflow}>{multiSignAddress.slice(0, -6)}</span>
        <span>...</span>
        <span>{multiSignAddress.slice(-6)}</span>
      </CopyZone>
      <p>{t('multi-sign-address.create-dialog.multi-list', { m, n })}</p>
      <MultiSignAddressTable r={r} blake160s={blake160s} disabled />
    </>
  )
}

MultiSignAddressInfo.displayName = 'MultiSignAddressInfo'

export default MultiSignAddressInfo
