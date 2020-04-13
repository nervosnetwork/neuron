import React from 'react'
import EditIcon from 'widgets/Icons/Edit.png'
import Button from 'widgets/Button'
import styles from './sUDTAccountPile.module.scss'

export interface SUDTAccountPileProps {
  accountId: string
  accountName?: string
  tokenName?: string
  symbol?: string
  balance: string
  tokenId: string
  isSelected: boolean
  onClick: React.EventHandler<React.SyntheticEvent<HTMLDivElement>>
}

const SUDTAccountPile = ({
  accountId,
  accountName,
  tokenName,
  symbol,
  balance,
  isSelected,
  onClick,
}: SUDTAccountPileProps) => {
  return (
    <div role="presentation" className={styles.container} onClick={onClick} data-id={accountId} data-role="container">
      <div className={styles.avatar}>
        <div className={styles.avatarIcon}>{accountName?.[0] ?? '?'}</div>
      </div>
      <div className={styles.accountName}>
        <span>{accountName || 'Undefined'}</span>
      </div>
      <div className={styles.tokenName}>
        <span>{tokenName || 'Unknown'}</span>
      </div>
      <div className={styles.symbol}>
        <span>{`(${symbol || 'Unkonw'})`}</span>
      </div>
      <div className={styles.editBtn}>
        <button data-role="edit" type="button">
          <img src={EditIcon} alt="edit" />
        </button>
      </div>
      {isSelected ? (
        <div className={styles.actions}>
          <Button type="primary" label="Receive" data-role="receive" disabled={!accountName} />
          <Button type="primary" label="Send" data-role="send" disabled={!accountName} />
        </div>
      ) : (
        <div className={styles.balance}>{balance || '--'}</div>
      )}
    </div>
  )
}

SUDTAccountPile.displayName = 'SUDTAccountPile'

export default SUDTAccountPile
