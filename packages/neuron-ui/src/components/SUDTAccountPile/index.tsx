import React from 'react'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import EditIcon from 'widgets/Icons/Edit.png'
import Button from 'widgets/Button'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import { sudtValueToAmount } from 'utils/formatters'
import styles from './sUDTAccountPile.module.scss'

export interface SUDTAccountPileProps {
  accountId: string
  accountName?: string
  tokenName?: string
  symbol?: string
  balance: string
  tokenId: string
  address: string
  decimal: string
  onClick: React.EventHandler<React.SyntheticEvent<HTMLDivElement>>
}

const SUDTAccountPile = ({
  accountId,
  accountName,
  tokenName,
  symbol,
  balance,
  decimal,
  onClick,
}: SUDTAccountPileProps) => {
  const [t] = useTranslation()
  return (
    <div role="presentation" className={styles.container} onClick={onClick} data-id={accountId} data-role="container">
      <div className={styles.avatar}>
        <SUDTAvatar accountName={accountName} />
      </div>
      <div className={styles.accountName}>
        <span>{accountName || DEFAULT_SUDT_FIELDS.accountName}</span>
      </div>
      <div className={styles.tokenName}>
        <span>{tokenName || DEFAULT_SUDT_FIELDS.tokenName}</span>
      </div>
      <div className={styles.symbol}>
        <span>{`(${symbol || DEFAULT_SUDT_FIELDS.symbol})`}</span>
      </div>
      <div className={styles.editBtn}>
        <button data-role="edit" type="button">
          <img src={EditIcon} alt="edit" />
        </button>
      </div>
      <div className={styles.actions}>
        <Button type="primary" label={t('s-udt.account-list.receive')} data-role="receive" disabled={!accountName} />
        <Button type="primary" label={t('s-udt.account-list.send')} data-role="send" disabled={!accountName} />
      </div>
      <div className={styles.balance}>{sudtValueToAmount(balance, decimal) || '--'}</div>
    </div>
  )
}

SUDTAccountPile.displayName = 'SUDTAccountPile'

export default SUDTAccountPile
