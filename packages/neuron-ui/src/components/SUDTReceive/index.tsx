import React, { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { ReactComponent as Copy } from 'widgets/Icons/Copy.svg'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import Breadcrum from 'widgets/Breadcrum'

import { useDispatch } from 'states/stateProvider'
import QRCode from 'widgets/QRCode'
import { addPopup } from 'states/stateProvider/actionCreators'
import { Routes, defaultSUDTFields } from 'utils/const'
import styles from './sUDTReceive.module.scss'

const SUDTReceive = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { search } = useLocation()
  const {
    address,
    accountName = defaultSUDTFields.accountName,
    tokenName = defaultSUDTFields.tokenName,
  } = Object.fromEntries([...new URLSearchParams(search)])
  const breakcrum = [{ label: t('navbar.s-udt'), link: Routes.SUDTAccountList }]

  const copyAddress = useCallback(() => {
    window.navigator.clipboard.writeText(address)
    addPopup('addr-copied')(dispatch)
  }, [address, dispatch])

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
          <SUDTAvatar accountName={accountName} />
        </div>
        <div className={styles.accountName}>{accountName}</div>
        <div className={styles.tokenName}>{tokenName}</div>
      </div>
      <QRCode value={address} size={220} includeMargin dispatch={dispatch} />
      <div className={styles.address}>
        <input readOnly value={address} onClick={copyAddress} />
        <button type="button" aria-label={t('receive.click-to-copy')} onClick={copyAddress} className={styles.copyBtn}>
          <Copy />
        </button>
      </div>
      <p className={styles.notation}>
        <Attention />
        {t('s-udt.receive.notation')}
      </p>
    </div>
  )
}

SUDTReceive.displayName = 'SUDTReceive'

export default SUDTReceive
