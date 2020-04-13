import React, { useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import styles from './breadcrum.module.scss'

export interface Page {
  label: string
  link: string
}

export interface BreadcumProps {
  pages: Page[]
}

const Breadcrum = ({ pages = [] }: BreadcumProps) => {
  const history = useHistory()
  const onClick = useCallback(
    e => {
      const {
        dataset: { link },
      } = e.target as HTMLSpanElement
      if (link) {
        history.push(link)
      }
    },
    [useHistory]
  )

  return (
    <div className={styles.container}>
      {pages.map(page => (
        <span
          className={styles.page}
          role="presentation"
          key={page.label}
          data-link={page.link}
          onClick={onClick}
          title={page.label}
        >
          {page.label}
        </span>
      ))}
    </div>
  )
}

Breadcrum.displayName = 'Breadcrum'
export default Breadcrum
