import React from 'react'
import styles from './tag.module.scss'

interface Tag {
  text: string
  onClick: () => void
}

const Tag = ({ text, onClick }: Tag) => {
  return (
    <button type="button" className={styles.tag} onClick={onClick}>
      {text}
    </button>
  )
}

Tag.displayName = 'Tag'

export default Tag
