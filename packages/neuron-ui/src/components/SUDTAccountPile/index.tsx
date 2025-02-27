import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { HIDE_BALANCE, DEFAULT_SUDT_FIELDS } from 'utils/const'
import { sudtValueToAmount } from 'utils/formatters'
import Tooltip from 'widgets/Tooltip'
import { ReactComponent as Send } from 'widgets/Icons/SendStroke.svg'
import { ReactComponent as Receive } from 'widgets/Icons/ReceiveStroke.svg'
import { ArrowNext, Recycle } from 'widgets/Icons/icon'
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

  const balanceText = useMemo(() => sudtValueToAmount(balance, decimal), [balance, decimal])

  const overBalanceText = useMemo(() => {
    if (Number(decimal) > 8) {
      const [integer, radix] = balanceText.split('.')
      if (radix && radix.length > 8) {
        return `${integer}.${radix.slice(0, 8)}`
      }
    }
    return ''
  }, [balanceText, decimal])

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
            {overBalanceText && showBalance ? (
              <Tooltip tipClassName={styles.tip} placement="top" tip={<span>{balanceText}</span>} showTriangle>
                {overBalanceText}...
              </Tooltip>
            ) : (
              <span>{showBalance ? balanceText || '--' : HIDE_BALANCE}</span>
            )}
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
              {t('s-udt.account-list.set-account-info')} <ArrowNext />
            </button>
          )}
        </div>
      </div>

      {!isCKB && !disabled && (
        <button
          type="button"
          data-id={accountId}
          className={styles.recycleBtn}
          data-role="recycle"
          onClick={onClick}
          disabled={disabled}
        >
          <Tooltip tip={t('cell-manage.recycle')} showTriangle placement="top" isTriggerNextToChild>
            <Recycle />
          </Tooltip>
        </button>
      )}
    </div>
  )
}

SUDTAccountPile.displayName = 'SUDTAccountPile'

export default SUDTAccountPile
