import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import CopyZone from 'widgets/CopyZone'
import { Copy } from 'widgets/Icons/icon'
import { ErrorWithI18n } from 'exceptions'
import Table from 'widgets/Table'
import Tooltip from 'widgets/Tooltip'
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
  addressErrors?: (ErrorWithI18n | undefined)[]
}) => {
  const [t] = useTranslation()
  const dataSource = useMemo(() => addresses.map((value, idx) => ({ value, idx, index: idx + 1 })), [addresses])
  return (
    <div className={styles.tableWrap}>
      <Table
        columns={[
          {
            title: t('multisig-address.create-dialog.index'),
            dataIndex: 'index',
          },
          {
            title: t('multisig-address.create-dialog.required'),
            dataIndex: 'idx',
            render(_, __, item) {
              return (
                <label htmlFor={`${item.idx}`}>
                  <input
                    id={`${item.idx}`}
                    data-idx={item.idx}
                    type="checkbox"
                    onChange={changeR}
                    checked={item.idx < r}
                    disabled={item.idx > r || disabled}
                  />
                  <span />
                </label>
              )
            },
          },
          {
            title: t('multisig-address.table.address'),
            dataIndex: 'value',
            align: 'left',
            render(_, __, item) {
              return (
                <TextField
                  field={`${item.idx}_address`}
                  rows={2}
                  data-idx={item.idx}
                  value={item.value}
                  className={styles.addressField}
                  onChange={changeAddress}
                  disabled={disabled}
                  placeholder={t('multisig-address.create-dialog.multi-address-info.ckb-address-placeholder')}
                  error={
                    addressErrors?.[item.idx]
                      ? t(addressErrors[item.idx]!.message, addressErrors[item.idx]!.i18n)
                      : undefined
                  }
                />
              )
            },
          },
        ]}
        dataSource={dataSource}
      />
    </div>
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
    <div className={styles.container}>
      <p className={styles.title}>{t('multisig-address.create-dialog.multi-address-info.view-title', { m, n })}</p>
      <Tooltip
        tip={
          <CopyZone content={multisigAddress} className={styles.copyTableAddress}>
            {multisigAddress}
            <Copy />
          </CopyZone>
        }
        showTriangle
        isTriggerNextToChild
      >
        <div className={styles.addressWrap}>
          <span className={styles.overflow}>
            {multisigAddress.slice(0, 34)}...{multisigAddress.slice(-34)}
          </span>
        </div>
      </Tooltip>
      <p className={styles.title}>{t('multisig-address.create-dialog.multi-list', { m, n })}</p>
      <MultisigAddressTable r={r} addresses={addresses} disabled />
    </div>
  )
}

MultiSignAddressInfo.displayName = 'MultiSignAddressInfo'

export default MultiSignAddressInfo
