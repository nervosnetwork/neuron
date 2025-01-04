import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { AddressQrCodeWithCopyZone } from 'components/Receive'
import Dialog from 'widgets/Dialog'
import Alert from 'widgets/Alert'

import { CONSTANTS, addressToAddress } from 'utils'
import { getDisplayName, getDisplaySymbol } from 'components/UANDisplay'
import styles from './sUDTReceiveDialog.module.scss'

const { DEFAULT_SUDT_FIELDS } = CONSTANTS

export interface DataProps {
  address: string
  accountId: string
  accountName: string
  tokenName: string
  symbol: string
}

const SUDTReceiveDialog = ({ data, onClose }: { data: DataProps; onClose?: () => void }) => {
  const [t] = useTranslation()
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const { address, accountId, accountName, tokenName, symbol } = data

  const displayedAddr = isInShortFormat ? addressToAddress(address, { deprecated: true }) : address

  return (
    <Dialog
      show
      title={t('s-udt.account-list.receive')}
      onCancel={onClose}
      showFooter={false}
      contentClassName={styles.contentClassName}
    >
      <div className={styles.container}>
        <Alert status="warn" className={styles.notification}>
          <span>{t('s-udt.receive.notation', { symbol: getDisplaySymbol(tokenName || '', symbol || '') })}</span>
        </Alert>
        <div className={styles.info}>
          <SUDTAvatar type="logo" />
          <div className={styles.right}>
            <div className={styles.accountName}>{accountName || DEFAULT_SUDT_FIELDS.accountName}</div>
            <div className={styles.tokenName}>
              <span>
                {getDisplayName(tokenName || DEFAULT_SUDT_FIELDS.tokenName, symbol)}
                {` (${symbol || DEFAULT_SUDT_FIELDS.symbol})`}
              </span>
            </div>
          </div>
        </div>

        <AddressQrCodeWithCopyZone
          showAddress={displayedAddr}
          assetAccountId={accountId}
          isInShortFormat={isInShortFormat}
          onClick={() => setIsInShortFormat(is => !is)}
        />
      </div>
    </Dialog>
  )
}

SUDTReceiveDialog.displayName = 'SUDTReceiveDialog'

export default SUDTReceiveDialog
