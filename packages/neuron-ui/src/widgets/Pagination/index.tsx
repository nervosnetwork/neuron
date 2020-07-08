import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getPageNoList } from 'utils'
import { ReactComponent as ArrowToEndIcon } from 'widgets/Icons/ArrowToEnd.svg'
import { ReactComponent as ArrowToNextIcon } from 'widgets/Icons/ArrowToNext.svg'

import styles from './pagination.module.scss'

const I18N_PATH = 'pagination'

export interface PaginationProps {
  count: number
  pageNo: number
  pageSize: number
  onChange: Function
}

const Pagination = ({ count, pageNo, onChange, pageSize }: PaginationProps) => {
  const [t] = useTranslation()
  const pageCount = Math.ceil(count / pageSize)
  const pageNoList = getPageNoList(pageNo, pageCount)

  const handlePageNoClick = useCallback(
    (e: React.SyntheticEvent<HTMLSpanElement>) => {
      const {
        dataset: { pageNo: no },
      } = e.target as HTMLSpanElement
      ;(e.target as any).blur()

      if (no && !Number.isNaN(+no)) {
        onChange(+no)
      }
    },
    [onChange]
  )

  const start = (pageNo - 1) * pageSize + 1
  const end = Math.min(count, pageNo * pageSize)
  const range = t(`${I18N_PATH}.range`, { start, end, count })

  return (
    <div role="presentation" className={styles.container} onClick={handlePageNoClick}>
      <div className={styles.range}>{range}</div>
      <div className={styles.navigator} role="navigation" arial-label="pagination">
        <span
          role="button"
          data-page-no={1}
          tabIndex={pageNo === 1 ? -1 : 0}
          className={styles.toPrev}
          data-disabled={pageNo === 1}
          title={t(`${I18N_PATH}.first-page`)}
        >
          <ArrowToEndIcon />
        </span>
        <span
          role="button"
          data-page-no={pageNo - 1}
          tabIndex={pageNo === 1 ? -1 : 0}
          className={styles.toPrev}
          data-disabled={pageNo === 1}
          title={t(`${I18N_PATH}.previous-page`)}
        >
          <ArrowToNextIcon />
        </span>
        {pageNoList.map(no => (
          <span
            role="button"
            tabIndex={pageNo === no ? -1 : 0}
            key={no}
            className={styles.pageNo}
            data-page-no={no}
            data-active={pageNo === no}
            title={t(`${I18N_PATH}.page-no`, { pageNo: no })}
          >
            {no}
          </span>
        ))}
        <span
          role="button"
          tabIndex={pageNo === pageCount ? -1 : 0}
          data-page-no={pageNo + 1}
          className={styles.toNext}
          data-disabled={pageNo === pageCount}
          title={t(`${I18N_PATH}.next-page`)}
        >
          <ArrowToNextIcon />
        </span>
        <span
          role="button"
          tabIndex={pageNo === pageCount ? -1 : 0}
          data-page-no={count}
          className={styles.toNext}
          data-disabled={pageNo === pageCount}
          title={t(`${I18N_PATH}.last-page`)}
        >
          <ArrowToEndIcon />
        </span>
      </div>
    </div>
  )
}

Pagination.displayName = 'Pagination'

export default Pagination
