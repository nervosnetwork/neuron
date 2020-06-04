import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import Breadcrum from 'widgets/Breadcrum'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'

import { useDispatch } from 'states'

import { RoutePath, CONSTANTS } from 'utils'
import styles from './sUDTReceive.module.scss'

const { DEFAULT_SUDT_FIELDS } = CONSTANTS

const SUDTReceive = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { search } = useLocation()
  const { address, accountName, tokenName, symbol } = Object.fromEntries([...new URLSearchParams(search)])
  const breakcrum = [{ label: t('navbar.s-udt'), link: RoutePath.SUDTAccountList }]

  if (!address) {
    return <div>Not Found</div>
  }

  return (
    <div
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <Breadcrum pages={breakcrum} />
      <div className={styles.title}>Receive</div>
      <div className={styles.info}>
        <div className={styles.avatar}>
          <SUDTAvatar accountName={accountName || DEFAULT_SUDT_FIELDS.accountName} />
        </div>
        <div className={styles.accountName}>{accountName || DEFAULT_SUDT_FIELDS.accountName}</div>
        <div className={styles.tokenName}>{tokenName || DEFAULT_SUDT_FIELDS.tokenName}</div>
      </div>
      <QRCode value={address} size={220} includeMargin dispatch={dispatch} />
      <div className={styles.address}>
        <CopyZone content={address} name={t('receive.copy-address')} style={{ lineHeight: '1.625rem' }}>
          <span className={styles.addressValue}>{address}</span>
        </CopyZone>
      </div>
      <p className={styles.notation}>
        <Attention />
        {t('s-udt.receive.notation', { symbol: symbol || DEFAULT_SUDT_FIELDS.symbol })}
      </p>
    </div>
  )
}

SUDTReceive.displayName = 'SUDTReceive'

export default SUDTReceive
