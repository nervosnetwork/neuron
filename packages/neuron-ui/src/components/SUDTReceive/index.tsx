import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addressToScript, bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { ReactComponent as AddressToggleIcon } from 'widgets/Icons/AddressTransform.svg'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import Breadcrum from 'widgets/Breadcrum'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'

import { useDispatch } from 'states'

import { RoutePath, CONSTANTS } from 'utils'
import styles from './sUDTReceive.module.scss'

const { DEFAULT_SUDT_FIELDS } = CONSTANTS
const toShortAddr = (addr: string) => {
  try {
    const script = addressToScript(addr)
    const isMainnet = addr.startsWith('ckb')
    return bech32Address(script.args, {
      prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet,
      codeHashOrCodeHashIndex: '0x02',
    })
  } catch {
    return ''
  }
}

const SUDTReceive = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { search } = useLocation()
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const { address, accountName, tokenName, symbol } = Object.fromEntries([...new URLSearchParams(search)])
  const breakcrum = [{ label: t('navbar.s-udt'), link: RoutePath.SUDTAccountList }]

  if (!address) {
    return <div>Not Found</div>
  }

  const displayedAddr = isInShortFormat ? toShortAddr(address) : address

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
          <SUDTAvatar name={accountName} />
        </div>
        <div className={styles.accountName}>{accountName || DEFAULT_SUDT_FIELDS.accountName}</div>
        <div className={styles.tokenName}>{tokenName || DEFAULT_SUDT_FIELDS.tokenName}</div>
      </div>
      <QRCode value={displayedAddr} size={220} includeMargin dispatch={dispatch} />
      <div className={styles.address}>
        <CopyZone content={displayedAddr} name={t('receive.copy-address')} style={{ lineHeight: '1.625rem' }}>
          {displayedAddr}
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
      <p className={styles.notation}>
        <Attention />
        {t('s-udt.receive.notation', { symbol: symbol || DEFAULT_SUDT_FIELDS.symbol })}
      </p>
    </div>
  )
}

SUDTReceive.displayName = 'SUDTReceive'

export default SUDTReceive
