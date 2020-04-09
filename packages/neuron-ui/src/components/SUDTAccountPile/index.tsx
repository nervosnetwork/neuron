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
  onEditClick: React.EventHandler<React.SyntheticEvent<HTMLElement>>
  onSendClick: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onReceiveClick: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
}

const SUDTAccountPile = ({
  accountId,
  accountName,
  tokenName,
  symbol,
  balance,
  isSelected,
  onEditClick,
  onReceiveClick,
  onSendClick,
}: SUDTAccountPileProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.avatar}>
        <div className={styles.avatarIcon}>{accountName?.[0] ?? '?'}</div>
      </div>
      <div className={styles.accountName}>{accountName || 'Undefined'}</div>
      <div className={styles.tokenName}>{tokenName || 'Unknown'}</div>
      <div className={styles.symbol}>{`(${symbol || 'Unkonw'})`}</div>
      <div className={styles.editBtn}>
        <button onClick={onEditClick} data-id={accountId} type="button">
          <img src={EditIcon} alt="edit" />
        </button>
      </div>
      {isSelected ? (
        <div className={styles.actions}>
          <Button type="primary" label="Receive" data-id={accountId} onClick={onReceiveClick} disabled={!accountName} />
          <Button type="primary" label="Send" data-id={accountId} onClick={onSendClick} disabled={!accountName} />
        </div>
      ) : (
        <div className={styles.balance}>{balance || '--'}</div>
      )}
    </div>
  )
}

SUDTAccountPile.displayName = 'SUDTAccountPile'

export default SUDTAccountPile
