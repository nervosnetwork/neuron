import React from 'react'
import { clsx } from 'utils'
import styles from './badge.module.scss'

const Badge = ({ children, className }: { children: React.ReactChild; className?: string }) => {
  return <div className={clsx(styles.badge, className)}>{children}</div>
}

export default Badge
