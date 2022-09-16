import React from 'react'
import { SuccessInfo, Error as ErrorIcon } from 'widgets/Icons/icon'
import styles from './index.module.scss'

export enum AlertStatus {
  Init = 'init',
  Success = 'success',
  Error = 'error',
}

const Alert: React.FC<{ status: AlertStatus; className?: string }> = ({ status, children, className }) => {
  return (
    <li className={`${styles[status]} ${className || ''} ${styles.alert}`}>
      {status === AlertStatus.Success && <SuccessInfo type="success" />}
      {status === AlertStatus.Error && <ErrorIcon type="error" />}
      {children}
    </li>
  )
}

Alert.displayName = 'Alert'

export default Alert
