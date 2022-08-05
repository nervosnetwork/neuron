import React from 'react'
import { SuccessInfo, Error as ErrorIcon } from 'widgets/Icons/icon'
import styles from './index.module.scss'

export enum AlertStatus {
  Init = 0,
  Success = 1,
  Error = 2,
}

const getClassName = (status: AlertStatus) => {
  switch (status) {
    case AlertStatus.Init:
      return styles.init
    case AlertStatus.Error:
      return styles.error
    case AlertStatus.Success:
      return styles.success
    default:
      return styles.init
  }
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
    <li className={`${getClassName(status)} ${className || ''} ${styles.alert}`}>
      {status === AlertStatus.Success && <SuccessInfo type="success" />}
      {status === AlertStatus.Error && <ErrorIcon type="error" />}
      {children}
    </li>
  )
}

Alert.displayName = 'Alert'

export default Alert
