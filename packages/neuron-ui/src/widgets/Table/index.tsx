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
    align?: 'left' | 'right' | 'center'
    className?: string
  }[]
  dataKey?: string
  dataSource: T[]
  noDataContent?: string
  onRowDoubleClick?: (e: React.SyntheticEvent, item: T, idx: number) => void
}

const Table = <T extends Record<string, any>>(props: TableProps<T>) => {
  const { head, columns, dataSource, noDataContent, onRowDoubleClick, dataKey } = props
  const [showBalance, setShowBalance] = useState(true)
  const onClickBalanceIcon = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])
  return (
    <div className={styles.tableRoot}>
      {head}
      <table className={`${styles.table} ${head === null || head === undefined ? styles.noHead : ''}`}>
        <thead>
          <tr>
            {columns.map(({ title, dataIndex, key, isBalance, align, className }) => {
              return (
                <th
                  key={key || dataIndex}
                  title={title}
                  aria-label={title}
                  data-field={dataIndex}
                  align={align ?? 'left'}
                  className={className}
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
                {columns.map(({ dataIndex, key, render, align }) => (
                  <td align={align ?? 'left'} key={key ?? dataIndex}>
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
