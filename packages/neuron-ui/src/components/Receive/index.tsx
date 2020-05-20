import React, { useCallback, useMemo } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'
import { RoutePath } from 'utils'
import { useState as useGlobalState, useDispatch } from 'states'
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
  const history = useHistory()

  const accountAddress = useMemo(
    () => (address || addresses.find(addr => addr.type === 0 && addr.txCount === 0)?.address) ?? '',
    [address, addresses]
  )

  const onAddressBookClick = useCallback(() => {
    history.push(RoutePath.Addresses)
  }, [history])

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
      <div className={styles.title}>{t('receive.title')}</div>
      <QRCode value={accountAddress} size={220} includeMargin dispatch={dispatch} />
      <div className={styles.address}>
        <CopyZone content={accountAddress} name={t('receive.copy-address')} style={{ lineHeight: '1.625rem' }}>
          {accountAddress}
        </CopyZone>
      </div>
      <p className={styles.notation}>{t('receive.prompt')}</p>
      <Button
        type="primary"
        className={styles.addressBook}
        label={t('receive.address-book')}
        onClick={onAddressBookClick}
      />
    </div>
  )
}

Receive.displayName = 'Receive'

export default Receive
