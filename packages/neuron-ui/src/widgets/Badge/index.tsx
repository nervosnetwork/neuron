import React from 'react'
import styles from './badge.module.scss'

const Badge = ({ children }: { children: React.ReactChild }) => {
  return <div className={styles.badge}>{children}</div>
}

export default Badge
