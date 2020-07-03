import React from 'react'
import { DEFAULT_SUDT_FIELDS } from 'utils/const'
import styles from './sUDTAvatar.module.scss'

const SUDTAvatar = ({
  name,
  type = 'account',
  style = {},
}: {
  name?: string
  type?: 'account' | 'token'
  style?: React.CSSProperties
}) => {
  return (
    <div className={styles.avatarIcon} style={style}>
      {(name || (type === 'account' ? DEFAULT_SUDT_FIELDS.accountName : DEFAULT_SUDT_FIELDS.tokenName))[0]}
    </div>
  )
}

SUDTAvatar.displayName = 'SUDTAvatar'

export default SUDTAvatar
