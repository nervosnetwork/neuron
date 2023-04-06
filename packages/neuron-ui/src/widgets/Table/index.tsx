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
    render?: (v: any, idx: number, item: T, showBalance: boolean) => React.ReactNode
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
}

const Table = <T extends Record<string, any>>(props: TableProps<T>) => {
  const { head, columns, dataSource, noDataContent, onRowDoubleClick, dataKey, className = '', isFixedTable } = props
  const [showBalance, setShowBalance] = useState(true)
  const onClickBalanceIcon = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])
  return (
    <div
      className={`${styles.tableRoot} ${className} ${isFixedTable ? styles.fixedTableRoot : ''}`}
      data-have-head={!!head}
    >
      {head && typeof head === 'string' ? <div className={styles.head}>{head}</div> : head}
      <table className={`${styles.table} ${head === null || head === undefined ? styles.noHead : ''}`}>
        <thead>
          <tr>
            {columns.map(({ title, dataIndex, key, isBalance, align, className: headClassName }) => {
              return (
                <th
                  key={key || dataIndex}
                  title={typeof title === 'string' ? title : dataIndex}
                  aria-label={typeof title === 'string' ? title : dataIndex}
                  data-field={dataIndex}
                  align={align ?? 'left'}
                  className={headClassName}
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
              // eslint-disable-next-line react/no-array-index-key
              <tr
                onDoubleClick={onRowDoubleClick ? e => onRowDoubleClick(e, item, idx) : undefined}
                key={dataKey ? item[dataKey] : idx}
              >
                {columns.map(({ dataIndex, key, render, align, className: bodyTdClassName, tdClassName }) => (
                  <td align={align ?? 'left'} key={key ?? dataIndex} className={tdClassName ?? bodyTdClassName}>
                    {render ? render(item[dataIndex], idx, item, showBalance) : item[dataIndex]}
                  </td>
                ))}
              </tr>
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
