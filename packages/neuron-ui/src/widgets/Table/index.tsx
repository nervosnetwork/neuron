import React, { useCallback, useState } from 'react'
import { PasswordHide, PasswordShow } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'

import styles from './table.module.scss'

export type TableProps<T> = {
  head?: React.ReactNode
  columns: {
    title: React.ReactNode
    dataIndex: string
    key?: string
    isBalance?: boolean
    render?: (v: any, idx: number, item: T, showBalance: boolean, expandedRow: number | null) => React.ReactNode
    width?: string
    minWidth?: string
    align?: 'left' | 'right' | 'center'
    className?: string
    tdClassName?: string
  }[]
  dataKey?: string
  dataSource: T[]
  noDataContent?: string
  onRowDoubleClick?: (e: React.SyntheticEvent, item: T, idx: number) => void
  className?: string
  isFixedTable?: boolean
  rowExtendRender?: (v: T, idx: number) => React.ReactNode
}

const Table = <T extends Record<string, any>>(props: TableProps<T>) => {
  const {
    head,
    columns,
    dataSource,
    noDataContent,
    onRowDoubleClick,
    dataKey,
    className = '',
    isFixedTable,
    rowExtendRender,
  } = props
  const [showBalance, setShowBalance] = useState(true)
  const onClickBalanceIcon = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])

  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const handleRowClick = (index: number) => {
    setExpandedRow(prevIndex => (prevIndex === index ? null : index))
  }

  return (
    <div
      className={`${styles.tableRoot} ${className} ${isFixedTable ? styles.fixedTableRoot : ''}`}
      data-have-head={!!head}
    >
      {head && typeof head === 'string' ? <div className={styles.head}>{head}</div> : head}
      <table className={`${styles.table} ${head === null || head === undefined ? styles.noHead : ''}`}>
        <thead>
          <tr>
            {columns.map(({ title, dataIndex, key, isBalance, align, width, minWidth, className: headClassName }) => {
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
                  {!!dataSource.length && isBalance ? (
                    <div className={styles.headWithBalance} style={{ justifyContent: align }}>
                      {title}
                      {showBalance ? (
                        <PasswordShow onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                      ) : (
                        <PasswordHide onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                      )}
                    </div>
                  ) : (
                    title
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {dataSource.map((item, idx) => {
            return (
              <>
                <tr
                  onDoubleClick={onRowDoubleClick ? e => onRowDoubleClick(e, item, idx) : undefined}
                  onClick={() => handleRowClick(idx)}
                  key={dataKey ? item[dataKey] : idx}
                  className={styles.trClassName}
                  data-idx={idx}
                >
                  {columns.map(({ dataIndex, key, render, align, className: bodyTdClassName, tdClassName }) => (
                    <td
                      align={align ?? 'left'}
                      key={key ?? dataIndex}
                      className={`${tdClassName ?? bodyTdClassName} ${expandedRow === idx ? styles.noBorder : ''}`}
                    >
                      {render ? render(item[dataIndex], idx, item, showBalance, expandedRow) : item[dataIndex]}
                    </td>
                  ))}
                </tr>
                {expandedRow === idx && rowExtendRender?.(item, idx)}
              </>
            )
          })}
        </tbody>
      </table>
      {dataSource.length ? null : (
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
