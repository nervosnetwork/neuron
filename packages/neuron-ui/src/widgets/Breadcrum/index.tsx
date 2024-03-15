import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoBack } from 'widgets/Icons/icon'
import { useGoBack } from 'utils'
import styles from './breadcrum.module.scss'

export interface Page {
  label: string
  link?: string
}

export interface BreadcumProps {
  pages: Page[]
  showBackIcon?: boolean
}

const Breadcrum = ({ pages = [], showBackIcon }: BreadcumProps) => {
  const navigate = useNavigate()
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const {
        dataset: { link },
      } = e.target as HTMLSpanElement
      if (link) {
        navigate(link)
      }
    },
    [navigate]
  )
  const goBack = useGoBack()

  return (
    <div className={styles.container}>
      {showBackIcon ? <GoBack className={styles.goBack} onClick={goBack} /> : null}
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
