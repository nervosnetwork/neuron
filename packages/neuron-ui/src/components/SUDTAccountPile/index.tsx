import React from 'react'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { HIDE_BALANCE, DEFAULT_SUDT_FIELDS } from 'utils/const'
import { sudtValueToAmount } from 'utils/formatters'
import { ReactComponent as Send } from 'widgets/Icons/SendStroke.svg'
import { ReactComponent as Receive } from 'widgets/Icons/ReceiveStroke.svg'
import { ReactComponent as ArrowOpenRight } from 'widgets/Icons/ArrowOpenRight.svg'
import styles from './sUDTAccountPile.module.scss'

export interface SUDTAccountPileProps {
  accountId: string
  accountName?: string
  tokenName?: string
  symbol?: string
  balance: string
  tokenId: string
  decimal: string
  onClick: React.EventHandler<React.SyntheticEvent<HTMLElement>>
  showBalance?: boolean
}

const SUDTAccountPile = ({
  accountId,
  tokenId,
  accountName,
  tokenName,
  symbol,
  balance,
  decimal,
  onClick,
  showBalance,
}: SUDTAccountPileProps) => {
  const [t] = useTranslation()
  const isCKB = DEFAULT_SUDT_FIELDS.CKBTokenId === tokenId
  const disabled = !isCKB && !decimal

  return (
    <div className={styles.container}>
      <SUDTAvatar type="logo" />
      <div className={styles.info}>
        <div role="presentation" data-id={accountId} data-role="edit" className={styles.baseInfo} onClick={onClick}>
          <div className={styles.accountName}>
            <span>{accountName || DEFAULT_SUDT_FIELDS.accountName}</span>
          </div>
          <div className={styles.tokenName}>
            <span>
              {tokenName || DEFAULT_SUDT_FIELDS.tokenName}
              {` (${symbol || DEFAULT_SUDT_FIELDS.symbol})`}
            </span>
          </div>
          <div className={styles.balance}>
            {showBalance ? sudtValueToAmount(balance, decimal) || '--' : HIDE_BALANCE}
          </div>
        </div>

        <div className={styles.footer}>
          {accountName ? (
            <div className={styles.actions}>
              <button type="button" data-id={accountId} data-role="receive" onClick={onClick} disabled={disabled}>
                <Receive />
                {t('s-udt.account-list.receive')}
              </button>
              <button type="button" data-id={accountId} data-role="send" onClick={onClick} disabled={disabled}>
                <Send />
                {t('s-udt.account-list.send')}
              </button>
            </div>
          ) : (
            <button data-id={accountId} data-role="edit" type="button" onClick={onClick} className={styles.editBtn}>
              {t('s-udt.account-list.set-account-info')} <ArrowOpenRight />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

SUDTAccountPile.displayName = 'SUDTAccountPile'

export default SUDTAccountPile
