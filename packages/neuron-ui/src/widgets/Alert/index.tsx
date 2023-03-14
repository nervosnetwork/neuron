import React from 'react'
import { SuccessInfo, Error as ErrorIcon, AttentionOutline } from 'widgets/Icons/icon'
import styles from './index.module.scss'

type AlertStatus = 'init' | 'success' | 'error' | 'warn'

const Alert: React.FC<{ status: AlertStatus; className?: string }> = ({ status, children, className }) => {
  return (
    <li className={`${styles[status]} ${className || ''} ${styles.alert}`}>
      {status === 'success' && <SuccessInfo type="success" />}
      {status === 'error' && <ErrorIcon type="error" />}
      {status === 'warn' && <AttentionOutline />}
      {children}
    </li>
  )
}

Alert.displayName = 'Alert'

export default Alert
