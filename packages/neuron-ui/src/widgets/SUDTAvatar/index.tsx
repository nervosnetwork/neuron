import React from 'react'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import styles from './sUDTAvatar.module.scss'

const SUDTAvatar = ({ accountName }: { accountName?: string }) => {
  return <div className={styles.avatarIcon}>{(accountName || DEFAULT_SUDT_FIELDS.accountName)[0]}</div>
}

SUDTAvatar.displayName = 'SUDTAvatar'

export default SUDTAvatar
