import React from 'react'
import { SuccessInfo, Error as ErrorIcon } from 'widgets/Icons/icon'
import styles from './index.module.scss'

export enum AlertStatus {
  Init = 'init',
  Success = 'success',
  Error = 'error',
}

const Alert = ({
  status,
  children,
  className,
}: {
  status: AlertStatus
  children?: React.ReactElement | string
  className?: string
}) => {
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
