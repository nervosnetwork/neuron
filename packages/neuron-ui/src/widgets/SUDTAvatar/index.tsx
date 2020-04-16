import React from 'react'
import styles from './sUDTAvatar.module.scss'

const SUDTAvatar = ({ accountName }: { accountName?: string }) => {
  return <div className={styles.avatarIcon}>{accountName?.[0] ?? '?'}</div>
}

SUDTAvatar.displayName = 'SUDTAvatar'

export default SUDTAvatar
