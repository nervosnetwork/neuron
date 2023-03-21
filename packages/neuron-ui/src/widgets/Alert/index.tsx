import React from 'react'
import { SuccessInfo, Error as ErrorIcon } from 'widgets/Icons/icon'
import styles from './index.module.scss'

export enum AlertStatus {
  Init = 'init',
  Success = 'success',
  Error = 'error',
}

const Alert: React.FC<{ status: AlertStatus; className?: string; withIcon?: boolean }> = ({
  status,
  children,
  className,
  withIcon = false,
}) => {
  return (
    <li className={`${styles[status]} ${className || ''} ${styles.alert}`}>
      {withIcon && status === AlertStatus.Success && <SuccessInfo type="success" />}
      {withIcon && status === AlertStatus.Error && <ErrorIcon type="error" />}
      {children}
    </li>
  )
}

Alert.displayName = 'Alert'

export default Alert
