import React from 'react'
import { useTranslation } from 'react-i18next'
import CopyZone from 'widgets/CopyZone'
import styles from './copyZoneAddress.module.scss'

const Address = ({ fullPayload, className }: { fullPayload: string; className?: string }) => {
  const [t] = useTranslation()
  return (
    <CopyZone
      content={fullPayload}
      className={`${styles.fullPayload} ${className || ''}`}
      name={t('multisig-address.table.copy-address')}
    >
      <span className={styles.overflow}>{fullPayload.slice(0, -6)}</span>
      <span>...</span>
      <span>{fullPayload.slice(-6)}</span>
    </CopyZone>
  )
}

Address.displayName = 'MultisigAddress'

export default React.memo(Address)
