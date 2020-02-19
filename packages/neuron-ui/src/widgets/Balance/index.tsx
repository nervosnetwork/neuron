import React from 'react'
import styles from './balance.module.scss'

const Balance = ({ balance, style }: { balance: string; style?: object }) => {
  const [balanceInt, balanceDec] = balance.split('.')
  const balanceIntEl = <span className={styles.int}>{balanceInt}</span>
  const balanceDecEl = balanceDec ? <span className={styles.decimal}>{`.${balanceDec}`}</span> : null
  const balanceSuffixEl = <span className={styles.suffix}>CKB</span>
  return (
    <span style={style} className={styles.balance}>
      {balanceIntEl}
      {balanceDecEl}
      {balanceSuffixEl}
    </span>
  )
}

export default Balance
