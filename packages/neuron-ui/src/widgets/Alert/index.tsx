import React from 'react'
import { SuccessInfo, Error as ErrorIcon, AttentionOutline } from 'widgets/Icons/icon'
import styles from './index.module.scss'

type AlertStatus = 'init' | 'success' | 'error' | 'warn'

const Alert: React.FC<{ status: AlertStatus; className?: string; withIcon?: boolean }> = ({
  status,
  children,
  className,
  withIcon = true,
}) => {
  return (
    <li className={`${styles[status]} ${className || ''} ${styles.alert}`}>
      {withIcon && status === 'success' ? <SuccessInfo type="success" /> : null}
      {withIcon && status === 'error' ? <ErrorIcon type="error" /> : null}
      {withIcon && status === 'warn' && <AttentionOutline />}
      {children}
    </li>
  )
}

Alert.displayName = 'Alert'

export default Alert
