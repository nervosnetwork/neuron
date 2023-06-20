import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getPageNoList } from 'utils'
import { ArrowEnd, ArrowNext } from 'widgets/Icons/icon'

import styles from './pagination.module.scss'

const I18N_PATH = 'pagination'

export interface PaginationProps {
  count: number
  pageNo: number
  pageSize: number
  onChange: (page: number) => void
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

  if (!count) {
    return null
  }

  const start = (pageNo - 1) * pageSize + 1
  const end = Math.min(count, pageNo * pageSize)
  const range = t(`${I18N_PATH}.range`, { start, end, count })

  const disableToHead = pageNo === 1 || pageCount === 0
  const disableToEnd = pageNo >= pageCount

  return (
    <div role="presentation" className={styles.container} onClick={handlePageNoClick}>
      <div className={styles.range}>{range}</div>
      <div className={styles.navigator} role="navigation" aria-label="pagination">
        <div className={styles.arrowBlock}>
          <button
            type="button"
            data-page-no={1}
            tabIndex={pageNo === 1 ? -1 : 0}
            className={styles.toHead}
            data-disabled={disableToHead}
            data-title="first-page"
            title={t(`${I18N_PATH}.first-page`)}
          >
            <ArrowEnd />
          </button>
          <button
            type="button"
            data-page-no={pageNo - 1}
            tabIndex={pageNo === 1 ? -1 : 0}
            className={styles.toHead}
            data-disabled={disableToHead}
            data-title="previous-page"
            title={t(`${I18N_PATH}.previous-page`)}
          >
            <ArrowNext />
          </button>
        </div>

        {pageNoList.map(no => (
          <button
            type="button"
            tabIndex={pageNo === no ? -1 : 0}
            key={no}
            className={styles.pageNo}
            data-page-no={no}
            data-active={pageNo === no}
            title={t(`${I18N_PATH}.page-no`, { pageNo: no })}
          >
            {no}
          </button>
        ))}

        <div className={styles.arrowBlock}>
          <button
            type="button"
            tabIndex={pageNo === pageCount ? -1 : 0}
            data-page-no={pageNo + 1}
            className={styles.toEnd}
            data-disabled={disableToEnd}
            data-title="next-page"
            title={t(`${I18N_PATH}.next-page`)}
          >
            <ArrowNext />
          </button>

          <button
            type="button"
            tabIndex={pageNo === pageCount ? -1 : 0}
            data-page-no={pageCount}
            className={styles.toEnd}
            data-disabled={disableToEnd}
            data-title="last-page"
            title={t(`${I18N_PATH}.last-page`)}
          >
            <ArrowEnd />
          </button>
        </div>
      </div>
    </div>
  )
}

Pagination.displayName = 'Pagination'

export default Pagination
