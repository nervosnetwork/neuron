import React, { useCallback, useState, useMemo } from 'react'
import { BalanceHide, BalanceShow, Sort } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'

import styles from './table.module.scss'

export enum SortType {
  Normal = '',
  Increase = 'increase',
  Decrease = 'decrease',
}

export type TableProps<T> = {
  head?: React.ReactNode
  columns: {
    title: React.ReactNode
    dataIndex: string
    key?: string
    isBalance?: boolean
    render?: (v: any, idx: number, item: T, showBalance: boolean) => React.ReactNode
    width?: string
    minWidth?: string
    align?: 'left' | 'right' | 'center'
    className?: string
    tdClassName?: string
    hidden?: boolean
    sorter?: (a: T, b: T, type: SortType) => number
  }[]
  dataKey?: string
  dataSource: T[]
  noDataContent?: string
  onRowDoubleClick?: (e: React.SyntheticEvent, item: T, idx: number) => void
  onRowClick?: (e: React.SyntheticEvent, item: T, idx: number) => void
  className?: string
  isFixedTable?: boolean
  rowExtendRender?: (v: T, idx: number) => React.ReactNode
  expandedRow?: number | null
  hasHoverTrBg?: boolean
}

const Table = <T extends Record<string, any>>(props: TableProps<T>) => {
  const {
    head,
    columns,
    dataSource,
    noDataContent,
    onRowDoubleClick,
    onRowClick,
    dataKey,
    className = '',
    isFixedTable,
    rowExtendRender,
    expandedRow,
    hasHoverTrBg = true,
  } = props
  const [showBalance, setShowBalance] = useState(true)
  const onClickBalanceIcon = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])

  const handleRowClick = (e: React.SyntheticEvent, item: T, idx: number) => {
    onRowClick?.(e, item, idx)
  }

  const columnList = useMemo(() => columns.filter(item => !item.hidden), [columns])

  const [sortIndex, setSortIndex] = useState(-1)
  const [sortType, setSortType] = useState<SortType>(SortType.Normal)

  const currentDataSource = useMemo(() => {
    if (sortIndex !== -1 && sortType !== SortType.Normal) {
      const { sorter } = columnList[sortIndex]
      if (sorter) {
        return [...dataSource].sort((a: T, b: T) => sorter(a, b, sortType))
      }
    }
    return dataSource
  }, [columnList, dataSource, sortIndex, sortType])

  const handleSort = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const { dataset } = e.currentTarget
      const { index, type } = dataset as { index: string; type: SortType }
      const currentIndex = Number(index)

      if (sortIndex === currentIndex && sortType === type) {
        setSortIndex(-1)
        return
      }

      setSortIndex(currentIndex)
      setSortType(type)
    },
    [sortIndex, sortType, setSortIndex, setSortType]
  )

  return (
    <div
      className={`${styles.tableRoot} ${className} ${isFixedTable ? styles.fixedTableRoot : ''}`}
      data-have-head={!!head}
    >
      {head && typeof head === 'string' ? <div className={styles.head}>{head}</div> : head}
      <table
        className={`${styles.table} ${head === null || head === undefined ? styles.noHead : ''}`}
        data-hover-tr-bg={hasHoverTrBg}
      >
        <thead>
          <tr>
            {columnList.map(
              (
                { title, dataIndex, key, isBalance, align, width, minWidth, className: headClassName, sorter },
                index
              ) => {
                return (
                  <th
                    key={key || dataIndex}
                    title={typeof title === 'string' ? title : dataIndex}
                    aria-label={typeof title === 'string' ? title : dataIndex}
                    data-field={dataIndex}
                    align={align ?? 'left'}
                    className={headClassName}
                    style={{ width, minWidth }}
                  >
                    <div className={styles.thWrap} style={{ justifyContent: align }}>
                      {!!currentDataSource.length && isBalance ? (
                        <div className={styles.headWithBalance} style={{ justifyContent: align }}>
                          {title}
                          {showBalance ? (
                            <BalanceShow onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                          ) : (
                            <BalanceHide onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                          )}
                        </div>
                      ) : (
                        title
                      )}
                      {sorter ? (
                        <div className={styles.sorter}>
                          <Sort
                            data-index={index}
                            data-type={SortType.Increase}
                            onClick={handleSort}
                            data-active={sortIndex === index && sortType === SortType.Increase}
                          />
                          <Sort
                            data-index={index}
                            data-type={SortType.Decrease}
                            onClick={handleSort}
                            data-active={sortIndex === index && sortType === SortType.Decrease}
                          />
                        </div>
                      ) : null}
                    </div>
                  </th>
                )
              }
            )}
          </tr>
        </thead>
        <tbody style={{ cursor: onRowClick ? 'pointer' : undefined }}>
          {currentDataSource.map((item, idx) => {
            return (
              <>
                <tr
                  onDoubleClick={onRowDoubleClick ? e => onRowDoubleClick(e, item, idx) : undefined}
                  onClick={e => handleRowClick(e, item, idx)}
                  key={dataKey ? item[dataKey] : idx}
                  className={styles.trClassName}
                  data-idx={idx}
                  data-is-expand={expandedRow === idx}
                >
                  {columnList.map(
                    ({ dataIndex, key, render, align, className: bodyTdClassName, tdClassName, width }) => (
                      <td
                        align={align ?? 'left'}
                        key={key ?? dataIndex}
                        width={width}
                        className={`${tdClassName ?? bodyTdClassName} ${
                          expandedRow === idx && rowExtendRender ? styles.noBorder : ''
                        }`}
                      >
                        {render ? render(item[dataIndex], idx, item, showBalance) : item[dataIndex]}
                      </td>
                    )
                  )}
                </tr>
                {expandedRow === idx && rowExtendRender?.(item, idx)}
              </>
            )
          })}
        </tbody>
      </table>
      {currentDataSource.length ? null : (
        <div className={styles.noData}>
          <img src={TableNoData} alt="No Data" />
          {noDataContent}
        </div>
      )}
    </div>
  )
}

Table.displayName = 'Table'
export default Table
