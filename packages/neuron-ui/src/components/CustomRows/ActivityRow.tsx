import React from 'react'
import { IDetailsRowProps } from 'office-ui-fabric-react'
import { showTransactionDetails } from 'services/remote'

import { shannonToCKBFormatter, uniformTimeFormatter as timeFormatter } from 'utils/formatters'

import * as styles from './activityRow.module.scss'

export interface ActivityItem extends State.Transaction {
  confirmations: string
  statusLabel: string
  typeLabel: string
}

interface ActivityRowProps extends IDetailsRowProps {
  item: ActivityItem
}

const ActivityRow = (props?: ActivityRowProps) => {
  if (!props) {
    return null
  }
  const { item } = props
  if (!item) {
    return null
  }
  const { confirmations, createdAt, description, hash, status, statusLabel, timestamp, typeLabel, value } = item
  const time = timeFormatter(timestamp || createdAt)

  const onDoubleClick = () => {
    showTransactionDetails(hash)
  }

  return (
    <div
      className={`${styles.activityRow} ${styles[status]}`}
      title={`${hash}: ${description || ''}`}
      onDoubleClick={onDoubleClick}
    >
      <div className={styles.action}>{`${typeLabel} ${shannonToCKBFormatter(value)} CKB`}</div>
      <div className={styles.status}>{statusLabel}</div>
      <div className={styles.time}>{time}</div>
      <div className={styles.meta}>{confirmations}</div>
    </div>
  )
}

ActivityRow.displayName = 'ActivityRow'
export default ActivityRow
