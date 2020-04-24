import React, { useCallback, useMemo } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ReactComponent as Copy } from 'widgets/Icons/Copy.svg'
import Button from 'widgets/Button'
import QRCode from 'widgets/QRCode'

import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { addPopup } from 'states/stateProvider/actionCreators'
import { Routes } from 'utils/const'
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
    () => address || (addresses.find(addr => addr.type === 0 && addr.txCount === 0) || { address: '' }).address || '',
    [address, addresses]
  )

  const copyAddress = useCallback(() => {
    window.navigator.clipboard.writeText(accountAddress)
    addPopup('addr-copied')(dispatch)
  }, [accountAddress, dispatch])

  const Address = useMemo(
    () => (
      <div className={styles.address}>
        <input readOnly value={accountAddress} onClick={copyAddress} />
        <button type="button" aria-label={t('receive.click-to-copy')} onClick={copyAddress} className={styles.copyBtn}>
          <Copy />
        </button>
      </div>
    ),
    [copyAddress, accountAddress, t]
  )

  const onAddressBookClick = useCallback(() => {
    history.push(Routes.Addresses)
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
      {Address}
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
