import React, { useCallback, useState } from 'react'
import { PasswordHide, PasswordShow } from 'widgets/Icons/icon'
import TableNoData from 'widgets/Icons/TableNoData.png'

import styles from './table.module.scss'

type TableProps<T> = {
  head?: React.ReactNode
  columns: {
    title: string
    dataIndex: string
    key?: string
    isBalance?: boolean
    render?: (v: any, idx: number, item: T, showBalance: boolean) => React.ReactNode
    align?: 'left' | 'right'
    className?: string
  }[]
  dataSource: T[]
  noDataContent: string
  onRowDoubleClick?: (e: React.SyntheticEvent, item: T, idx: number) => void
}

const Table = <T extends Record<string, any>>(props: TableProps<T>) => {
  const { head, columns, dataSource, noDataContent, onRowDoubleClick } = props
  const [showBalance, setShowBalance] = useState(true)
  const onClickBalanceIcon = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])
  return (
    <div className={styles.tableRoot}>
      {head}
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(({ title, dataIndex, key, isBalance, align, className }) => {
              return (
                <th
                  key={key || dataIndex}
                  title={title}
                  aria-label={title}
                  data-field={dataIndex}
                  align={align}
                  className={className}
                >
                  <div>
                    {title}
                    {!!dataSource.length && isBalance && showBalance && (
                      <PasswordShow onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                    )}
                    {!!dataSource.length && isBalance && !showBalance && (
                      <PasswordHide onClick={onClickBalanceIcon} className={styles.balanceIcon} />
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {dataSource.map((item, idx) => {
            return (
              <tr onDoubleClick={onRowDoubleClick ? e => onRowDoubleClick(e, item, idx) : undefined}>
                {columns.map(({ dataIndex, render, align }) => (
                  <td align={align}>{render ? render(item[dataIndex], idx, item, showBalance) : item[dataIndex]}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!dataSource.length && (
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
