import React, { useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addressToScript, bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import Button from 'widgets/Button'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'
import { RoutePath } from 'utils'
import { useState as useGlobalState, useDispatch } from 'states'
import { ReactComponent as AddressToggleIcon } from 'widgets/Icons/AddressTransform.svg'
import VerifyHardwareAddress from 'components/VerifyHardwareAddress'
import styles from './receive.module.scss'

const toShortAddr = (addr: string) => {
  try {
    const script = addressToScript(addr)
    const isMainnet = addr.startsWith('ckb')
    return bech32Address(script.args, { prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet })
  } catch {
    return ''
  }
}

const Receive = () => {
  const { wallet } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const [displayVerifyDialog, setDisplayVerifyDialog] = useState(false)
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const { addresses } = wallet
  const isSingleAddress = addresses.length === 1

  const accountAddress = useMemo(() => {
    let addr = ''
    if (isSingleAddress) {
      addr = addresses[0].address
    } else {
      addr = (address || addresses.find(a => a.type === 0 && a.txCount === 0)?.address) ?? ''
    }
    return isInShortFormat ? toShortAddr(addr) : addr
  }, [address, addresses, isSingleAddress, isInShortFormat])

  const onAddressBookClick = useCallback(() => {
    navigate(RoutePath.Addresses)
  }, [navigate])

  const onVerifyAddressClick = useCallback(() => {
    setDisplayVerifyDialog(true)
  }, [])

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
        <button
          type="button"
          className={styles.addressToggle}
          onClick={() => setIsInShortFormat(is => !is)}
          title={t(isInShortFormat ? `receive.turn-into-full-version-fomrat` : `receive.turn-into-deprecated-format`)}
        >
          <AddressToggleIcon />
        </button>
      </div>
      {isSingleAddress ? null : <p className={styles.notation}>{t('receive.prompt')}</p>}
      {isSingleAddress ? null : (
        <Button
          type="primary"
          className={styles.addressBook}
          label={t('receive.address-book')}
          onClick={onAddressBookClick}
        />
      )}
      {isSingleAddress && (
        <Button
          type="primary"
          className={styles.addressBook}
          label={t('receive.verify-address')}
          onClick={onVerifyAddressClick}
        />
      )}
      {displayVerifyDialog && (
        <VerifyHardwareAddress
          address={accountAddress}
          wallet={wallet}
          onDismiss={() => {
            setDisplayVerifyDialog(false)
          }}
        />
      )}
    </div>
  )
}

Receive.displayName = 'Receive'

export default Receive
