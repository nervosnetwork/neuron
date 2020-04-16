import React, { useCallback, useMemo } from 'react'
import { useRouteMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ReactComponent as Copy } from 'widgets/Icons/Copy.svg'

import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import QRCode from 'widgets/QRCode'
import { addPopup } from 'states/stateProvider/actionCreators'
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
      <QRCode value={accountAddress} size={220} includeMargin dispatch={dispatch} />
      {Address}
      <p className={styles.notation}>{t('receive.prompt')}</p>
    </div>
  )
}

Receive.displayName = 'Receive'

export default Receive
