import React, { useMemo } from 'react'
import { useRouteMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useState as useGlobalState, useDispatch } from 'states'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'
import styles from './receive.module.scss'

const Receive = () => {
  const {
    wallet: { addresses = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const {
    params: { address },
  } = useRouteMatch()

  const accountAddress = useMemo(
    () => (address || addresses.find(addr => addr.type === 0 && addr.txCount === 0)?.address) ?? '',
    [address, addresses]
  )

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <div
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <QRCode value={accountAddress} size={256} includeMargin dispatch={dispatch} />
      <div className={styles.address}>
        <CopyZone
          content={accountAddress}
          name={t('receive.copy-address')}
          style={{ lineHeight: '1.625rem', padding: '0 3px' }}
        >
          {accountAddress}
        </CopyZone>
      </div>
      <p className={styles.notation}>{t('receive.prompt')}</p>
    </div>
  )
}

Receive.displayName = 'Receive'

export default Receive
